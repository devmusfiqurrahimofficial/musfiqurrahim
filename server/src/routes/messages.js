import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { messages, parseId, toApi } from '../db/index.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { messageSchema, messageUpdateSchema } from '../models/schemas.js'
import { HttpError, validate } from '../utils/validation.js'

// Visitors may send; only the admin may read, mark or delete.
export function messagesRouter() {
  const router = Router()
  const idFrom = (req) => {
    const id = parseId(req.params.id)
    if (!id) throw new HttpError(404, 'Not found')
    return id
  }

  router.post('/', rateLimit({ max: 5, windowMs: 10 * 60 * 1000, message: 'Too many messages. Try again in a few minutes.' }), async (req, res) => {
    const { website, ...message } = validate(messageSchema, req.body)
    // Bots fill the hidden field; tell them it worked and keep nothing.
    if (!website) await messages().insertOne({ ...message, read: false, createdAt: new Date() })
    res.status(201).json({ ok: true })
  })

  router.get('/', requireAuth, async (req, res) => {
    const list = await messages().find().sort({ createdAt: -1 }).limit(500).toArray()
    res.json(list.map(toApi))
  })

  router.patch('/:id', requireAuth, async (req, res) => {
    const doc = await messages().findOneAndUpdate({ _id: idFrom(req) }, { $set: validate(messageUpdateSchema, req.body) }, { returnDocument: 'after' })
    if (!doc) throw new HttpError(404, 'Not found')
    res.json(toApi(doc))
  })

  router.delete('/:id', requireAuth, async (req, res) => {
    const { deletedCount } = await messages().deleteOne({ _id: idFrom(req) })
    if (!deletedCount) throw new HttpError(404, 'Not found')
    res.status(204).end()
  })

  return router
}
