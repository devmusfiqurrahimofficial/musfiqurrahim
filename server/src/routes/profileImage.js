import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { parseId, uploads } from '../db/index.js'
import { HttpError } from '../utils/validation.js'
import multer from 'multer'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB, keep in sync with MAX_UPLOAD_MB in client/src/features/uploads/compressImage.js
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// The browser's MIME type is only a claim, so the type is read from the file's first bytes.
function sniffImageType(buf) {
  const ascii = (start, end) => buf.toString('latin1', start, end)
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return 'image/gif'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

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

// Admin uploads (profile photo, project previews) and their public URLs. Each id is a new file,
// so they can be cached forever. Files nothing points at are removed by pruneUploads() in db/index.js.
export function uploadsRouter() {
  const router = Router()

  router.post('/', requireAuth, upload.single('image'), async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No image file provided.')
    const contentType = sniffImageType(req.file.buffer)
    if (!contentType) throw new HttpError(422, 'Only JPG, PNG, WEBP and GIF images are allowed.')
    const { insertedId } = await uploads().insertOne({ contentType, data: req.file.buffer, createdAt: new Date() })
    // Absolute, so the saved URL still points at the API when the site is served from another domain.
    res.json({ url: `${req.protocol}://${req.get('host')}/api/uploads/${insertedId}` })
  })

  router.get('/:id', async (req, res) => {
    const _id = parseId(req.params.id)
    const file = _id && (await uploads().findOne({ _id }))
    if (!file) throw new HttpError(404, 'Not found')
    res.set({
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      // Opened directly, the browser still shows the image, but nothing in it could ever run.
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    })
    res.send(Buffer.from(file.data.buffer))
  })

  return router
}
