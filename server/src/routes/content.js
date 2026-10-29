import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { commands, parseId, projects, settings, skills, toApi, touch } from '../db/index.js'
import { profileSchema, toolsSchema } from '../models/schemas.js'
import { HttpError, validate } from '../utils/validation.js'

const withoutId = ({ _id, ...rest }) => rest
const sorted = (collection) => collection().find().sort({ order: 1, _id: 1 }).toArray()

// Everything the public site needs, in one request.
export function portfolioRouter() {
  const router = Router()
  router.get('/', async (req, res) => {
    const [profile, projectList, skillList, commandList, tools, meta] = await Promise.all([
      settings().findOne({ _id: 'profile' }),
      sorted(projects),
      sorted(skills),
      sorted(commands),
      settings().findOne({ _id: 'tools' }),
      settings().findOne({ _id: 'meta' }),
    ])
    res.json({
      profile: withoutId(profile ?? {}),
      projects: projectList.map(toApi),
      skills: skillList.map(toApi),
      commands: commandList.map(toApi),
      tools: tools?.tools ?? [],
      updatedAt: meta?.updatedAt,
    })
  })
  return router
}

export function profileRouter() {
  const router = Router()
  router.get('/', async (req, res) => res.json(withoutId((await settings().findOne({ _id: 'profile' })) ?? {})))
  router.put('/', requireAuth, async (req, res) => {
    const profile = validate(profileSchema, req.body)
    await settings().replaceOne({ _id: 'profile' }, profile, { upsert: true })
    await touch()
    res.json(profile)
  })
  return router
}

export function toolsRouter() {
  const router = Router()
  router.get('/', async (req, res) => res.json({ tools: (await settings().findOne({ _id: 'tools' }))?.tools ?? [] }))
  router.put('/', requireAuth, async (req, res) => {
    const { tools } = validate(toolsSchema, req.body)
    await settings().updateOne({ _id: 'tools' }, { $set: { tools } }, { upsert: true })
    await touch()
    res.json({ tools })
  })
  return router
}

// Standard CRUD over one collection, kept in display order by an `order` field.
// Reads are public, writes need a token.
export function collectionRouter(collection, schema) {
  const router = Router()
  const idFrom = (req) => {
    const id = parseId(req.params.id)
    if (!id) throw new HttpError(404, 'Not found')
    return id
  }
  const found = (doc) => {
    if (!doc) throw new HttpError(404, 'Not found')
    return toApi(doc)
  }

  router.get('/', async (req, res) => res.json((await sorted(collection)).map(toApi)))

  router.get('/:id', async (req, res) => res.json(found(await collection().findOne({ _id: idFrom(req) }))))

  router.post('/', requireAuth, async (req, res) => {
    const [last] = await collection().find({}, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).toArray()
    const doc = { ...validate(schema, req.body), order: (last?.order ?? -1) + 1 }
    const { insertedId } = await collection().insertOne(doc)
    await touch()
    res.status(201).json(toApi({ _id: insertedId, ...doc }))
  })

  // Body: { ids: [...] } — every existing id, in the new order.
  router.post('/reorder', requireAuth, async (req, res) => {
    const ids = req.body?.ids
    const existing = new Set((await collection().find({}, { projection: { _id: 1 } }).toArray()).map((d) => String(d._id)))
    const valid = Array.isArray(ids) && ids.length === existing.size && new Set(ids).size === ids.length && ids.every((id) => existing.has(id))
    if (!valid) throw new HttpError(422, 'ids must list every item exactly once')
    if (ids.length) {
      await collection().bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: parseId(id) }, update: { $set: { order } } } })))
    }
    await touch()
    res.json((await sorted(collection)).map(toApi))
  })

  // Full validation fills in every schema field, so $set replaces the whole item but keeps `order`.
  router.put('/:id', requireAuth, async (req, res) => {
    const id = idFrom(req)
    const item = found(await collection().findOneAndUpdate({ _id: id }, { $set: validate(schema, req.body) }, { returnDocument: 'after' }))
    await touch()
    res.json(item)
  })

  router.patch('/:id', requireAuth, async (req, res) => {
    const id = idFrom(req)
    const changes = validate(schema, req.body, { partial: true })
    const doc = Object.keys(changes).length
      ? await collection().findOneAndUpdate({ _id: id }, { $set: changes }, { returnDocument: 'after' })
      : await collection().findOne({ _id: id })
    const item = found(doc)
    await touch()
    res.json(item)
  })

  router.delete('/:id', requireAuth, async (req, res) => {
    const { deletedCount } = await collection().deleteOne({ _id: idFrom(req) })
    if (!deletedCount) throw new HttpError(404, 'Not found')
    await touch()
    res.status(204).end()
  })

  return router
}
