import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { HttpError } from '../validation.js'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs/promises'

const uploadDir = path.resolve(process.cwd(), 'public/uploads')
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB, matches MAX_UPLOAD_MB in src/admin/pages/Profile.jsx
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Ensure upload directory exists.
fs.mkdir(uploadDir, { recursive: true }).catch(() => {})

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `profile-${Date.now()}${ext}`)
  }
})

const upload = multer({
  storage,
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
    const url = `/uploads/${req.file.filename}`
    res.json({ url })
  })

  return router
}