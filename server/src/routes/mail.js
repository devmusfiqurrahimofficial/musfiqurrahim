import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { sendToOwner } from '../services/mailer.js'
import { email, string, validate } from '../utils/validation.js'

const mailSchema = {
  from: email({ required: true }),
  subject: string({ min: 1, max: 200, required: true }),
  message: string({ min: 1, max: 5000, required: true }),
}

// Admin-only: emails the profile's contact address.
export function mailRouter() {
  const router = Router()

  router.post('/', requireAuth, async (req, res) => {
    const to = await sendToOwner(validate(mailSchema, req.body))
    res.json({ ok: true, to })
  })

  return router
}
