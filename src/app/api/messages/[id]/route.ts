import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { messages, parseId, toApi } from '@/lib/db'
import { handleApiError } from '@/lib/apiHelper'
import { messageUpdateSchema } from '@/lib/schemas'
import { HttpError, validate } from '@/lib/validation'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireAuth(req)
    const { id } = await params
    const _id = parseId(id)
    if (!_id) throw new HttpError(404, 'Not found')

    const body = await req.json().catch(() => ({}))
    const changes = validate(messageUpdateSchema, body)

    const messagesColl = await messages()
    const doc = await messagesColl.findOneAndUpdate(
      { _id },
      { $set: changes },
      { returnDocument: 'after' }
    )
    if (!doc) throw new HttpError(404, 'Not found')
    return NextResponse.json(toApi(doc))
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    await requireAuth(req)
    const { id } = await params
    const _id = parseId(id)
    if (!_id) throw new HttpError(404, 'Not found')

    const messagesColl = await messages()
    const { deletedCount } = await messagesColl.deleteOne({ _id })
    if (!deletedCount) throw new HttpError(404, 'Not found')
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
