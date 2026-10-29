import { existsSync } from 'node:fs'
import path from 'node:path'
import cors from 'cors'
import express from 'express'
import { config } from './config/index.js'
import { requireAuth } from './middleware/auth.js'
import { rateLimit } from './middleware/rateLimit.js'
import { closeDb, commands, connectDb, pingDb, projects, skills } from './db/index.js'
import { eventsHandler } from './services/events.js'
import { seedIfEmpty } from './db/seed.js'
import { HttpError } from './utils/validation.js'
import { commandSchema, projectSchema, skillGroupSchema } from './models/schemas.js'
import authRouter from './routes/auth.js'
import { collectionRouter, portfolioRouter, profileRouter, toolsRouter } from './routes/content.js'
import { messagesRouter } from './routes/messages.js'
import { mailRouter } from './routes/mail.js'
import { uploadsRouter } from './routes/profileImage.js'

try {
  await connectDb()
} catch (err) {
  console.error(`[db] Could not connect to MongoDB at ${config.mongoUri.replace(/\/\/[^@/]*@/, '//***@')}: ${err.message}`)
  console.error('[db] Start MongoDB or set MONGODB_URI in server/.env.')
  process.exit(1)
}
await seedIfEmpty()

const app = express()
app.disable('x-powered-by')
// Set when behind a reverse proxy (e.g. 1) so rate limits see the visitor's IP, not the proxy's.
app.set('trust proxy', config.trustProxy)

app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' })
  if (config.isProd) res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  next()
})
app.use('/api', (req, res, next) => {
  // The API only returns data, so nothing it sends may run scripts or load anything.
  res.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
  next()
})
app.use('/api', cors({ origin: config.corsOrigins }))
// A ceiling against floods; the contact form has its own, much lower limit.
app.use('/api', rateLimit({ max: 300, windowMs: 60 * 1000 }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', async (req, res) => {
  await pingDb()
  res.json({ ok: true })
})
// Secure by default: every write needs an admin token unless it's listed here.
// Routers also check auth themselves; requireAuth skips the second verification.
const PUBLIC_WRITES = new Set(['POST /api/messages'])
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || PUBLIC_WRITES.has(`${req.method} ${req.baseUrl}${req.path.replace(/\/$/, '')}`)) return next()
  return requireAuth(req, res, next)
})

app.get('/api/events', eventsHandler)
app.use('/api/auth', authRouter)
app.use('/api/portfolio', portfolioRouter())
app.use('/api/profile', profileRouter())
app.use('/api/tools', toolsRouter())
app.use('/api/projects', collectionRouter(projects, projectSchema))
app.use('/api/skills', collectionRouter(skills, skillGroupSchema))
app.use('/api/commands', collectionRouter(commands, commandSchema))
app.use('/api/messages', messagesRouter())
app.use('/api/mail', mailRouter())
// /api/profile-image is the old upload path, kept for admin builds that still use it.
app.use(['/api/uploads', '/api/profile-image'], uploadsRouter())
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

// In production the built frontend is served from here too. It's one React Router app
// (portfolio at /, admin under /admin), so any other GET gets index.html and the router takes over.
if (existsSync(config.distDir)) {
  app.use('/admin', (req, res, next) => {
    res.set('X-Robots-Tag', 'noindex')
    next()
  })
  app.use(express.static(config.distDir))
  // Paths with an extension are files; a missing one should 404, not get HTML. So should dotfiles
  // like /.env (which have no extension), so scanners don't mistake index.html for the real thing.
  app.get('/{*path}', (req, res, next) => (path.extname(req.path) || /\/\./.test(req.path) ? next() : res.sendFile(path.join(config.distDir, 'index.html'))))
}

app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, details: err.details })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' })
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' })
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Image must be under 10 MB.' })
  if (err.name === 'MulterError') return res.status(400).json({ error: err.message })
  // Unique index violation, e.g. two Terminal commands with the same name.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'value'
    return res.status(422).json({ error: 'Some fields need fixing', details: { [field]: 'is already used' } })
  }
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
})

const server = app.listen(config.port, () => {
  console.log(`[server] API listening on http://localhost:${config.port}/api`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close()
    closeDb().finally(() => process.exit(0))
  })
}
