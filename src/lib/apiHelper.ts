import { NextResponse } from 'next/server'
import type { Collection, Document } from 'mongodb'
import { requireAuth } from './auth'
import { parseId, toApi, touch } from './db'
import { logger } from './logger'
import { HttpError, validate } from './validation'

export function handleApiError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message, details: err.details }, { status: err.status })
  }
  const e = err as { code?: number | string; keyPattern?: Record<string, unknown>; message?: string }
  // Mongo unique index violation (e.g. unique command name)
  if (e?.code === 11000) {
    const field = Object.keys(e.keyPattern ?? {})[0] ?? 'value'
    return NextResponse.json(
      { error: 'Some fields need fixing', details: { [field]: 'is already used' } },
      { status: 422 }
    )
  }
  logger.error({ err }, 'API execution failure')
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
}

export async function sorted(collectionFn: () => Promise<Collection<Document>>) {
  const col = await collectionFn()
  return col.find().sort({ order: 1, _id: 1 }).toArray()
}

export async function getCollectionList(collectionFn: () => Promise<Collection<Document>>) {
  const items = await sorted(collectionFn)
  return NextResponse.json(items.map(toApi))
}

export async function getCollectionItem(collectionFn: () => Promise<Collection<Document>>, idStr: string) {
  const col = await collectionFn()
  const id = parseId(idStr)
  if (!id) throw new HttpError(404, 'Not found')
  const doc = await col.findOne({ _id: id })
  if (!doc) throw new HttpError(404, 'Not found')
  return NextResponse.json(toApi(doc))
}

export async function createCollectionItem<T extends Record<string, unknown>>(
  collectionFn: () => Promise<Collection<Document>>,
  schema: any,
  req: Request
) {
  await requireAuth(req)
  const body = await req.json().catch(() => ({}))
  const col = await collectionFn()
  const [last] = await col.find({}, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).toArray()
  const validated = validate<T>(schema, body)
  const doc = { ...validated, order: (last?.order ?? -1) + 1 }
  const { insertedId } = await col.insertOne(doc as Document)
  await touch()
  return NextResponse.json(toApi({ _id: insertedId, ...doc }), { status: 201 })
}

export async function updateCollectionItem<T extends Record<string, unknown>>(
  collectionFn: () => Promise<Collection<Document>>,
  schema: any,
  idStr: string,
  req: Request
) {
  await requireAuth(req)
  const id = parseId(idStr)
  if (!id) throw new HttpError(404, 'Not found')
  const body = await req.json().catch(() => ({}))
  const validated = validate<T>(schema, body)
  const col = await collectionFn()
  const doc = await col.findOneAndUpdate(
    { _id: id },
    { $set: validated as Document },
    { returnDocument: 'after' }
  )
  if (!doc) throw new HttpError(404, 'Not found')
  await touch()
  return NextResponse.json(toApi(doc))
}

export async function patchCollectionItem<T extends Record<string, unknown>>(
  collectionFn: () => Promise<Collection<Document>>,
  schema: any,
  idStr: string,
  req: Request
) {
  await requireAuth(req)
  const id = parseId(idStr)
  if (!id) throw new HttpError(404, 'Not found')
  const body = await req.json().catch(() => ({}))
  const changes = validate<Partial<T>>(schema, body, { partial: true })
  const col = await collectionFn()
  const doc = Object.keys(changes).length
    ? await col.findOneAndUpdate({ _id: id }, { $set: changes as Document }, { returnDocument: 'after' })
    : await col.findOne({ _id: id })
  if (!doc) throw new HttpError(404, 'Not found')
  await touch()
  return NextResponse.json(toApi(doc))
}

export async function deleteCollectionItem(collectionFn: () => Promise<Collection<Document>>, idStr: string, req: Request) {
  await requireAuth(req)
  const id = parseId(idStr)
  if (!id) throw new HttpError(404, 'Not found')
  const col = await collectionFn()
  const { deletedCount } = await col.deleteOne({ _id: id })
  if (!deletedCount) throw new HttpError(404, 'Not found')
  await touch()
  return new NextResponse(null, { status: 204 })
}

export async function reorderCollection(collectionFn: () => Promise<Collection<Document>>, req: Request) {
  await requireAuth(req)
  const body = await req.json().catch(() => ({}))
  const ids = body?.ids
  const col = await collectionFn()
  const existing = new Set((await col.find({}, { projection: { _id: 1 } }).toArray()).map((d) => String(d._id)))
  const valid =
    Array.isArray(ids) &&
    ids.length === existing.size &&
    new Set(ids).size === ids.length &&
    ids.every((id: string) => existing.has(id))

  if (!valid) throw new HttpError(422, 'ids must list every item exactly once')
  if (ids.length) {
    await col.bulkWrite(
      ids.map((id: string, order: number) => ({
        updateOne: { filter: { _id: parseId(id)! }, update: { $set: { order } } },
      }))
    )
  }
  await touch()
  const items = await sorted(collectionFn)
  return NextResponse.json(items.map(toApi))
}
