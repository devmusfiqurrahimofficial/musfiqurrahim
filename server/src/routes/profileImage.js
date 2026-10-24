import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { parseId, uploads } from '../db.js'
import { HttpError } from '../validation.js'
import multer from 'multer'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB, matches MAX_UPLOAD_MB in src/admin/pages/Profile.jsx
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Images live in MongoDB rather than on disk: hosts like Render wipe the disk on every
// restart, and the API may run on a different domain from the site.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true)
    else cb(new HttpError(422, 'Only JPG, PNG, WEBP and GIF images are allowed.'))
  }
})

export function profileImageRouter() {
  const router = Router()

  router.post('/', requireAuth, upload.single('image'), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided.' })
      return
    }
    const { insertedId } = await uploads().insertOne({ contentType: req.file.mimetype, data: req.file.buffer, createdAt: new Date() })
    // Absolute, so the saved URL still points at the API when the site is served from another domain.
    res.json({ url: `${req.protocol}://${req.get('host')}/api/uploads/${insertedId}` })
  })

  return router
}

// Public: serves the images uploaded above. Each id is a new file, so they can be cached forever.
export function uploadsRouter() {
  const router = Router()

  router.get('/:id', async (req, res) => {
    const _id = parseId(req.params.id)
    const file = _id && (await uploads().findOne({ _id }))
    if (!file) throw new HttpError(404, 'Not found')
    res.set({ 'Content-Type': file.contentType, 'Cache-Control': 'public, max-age=31536000, immutable', 'Cross-Origin-Resource-Policy': 'cross-origin' })
    res.send(Buffer.from(file.data.buffer))
  })

  return router
}
