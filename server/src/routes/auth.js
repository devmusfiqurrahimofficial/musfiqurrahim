import { Router } from 'express'
import { requireAuth } from '../auth.js'

// Signing in happens in the browser with Firebase. This only tells the admin panel
// whether the signed-in Firebase account is allowed in.
const router = Router()

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

export default router
