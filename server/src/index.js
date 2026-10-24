import { existsSync } from 'node:fs'
import path from 'node:path'
import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { requireAuth } from './auth.js'
import { closeDb, commands, connectDb, pingDb, projects, skills } from './db.js'
import { eventsHandler } from './events.js'
import { seedIfEmpty } from './seed.js'
import { HttpError } from './validation.js'
import { commandSchema, projectSchema, skillGroupSchema } from './schemas.js'
import authRouter from './routes/auth.js'
import { collectionRouter, portfolioRouter, profileRouter, toolsRouter } from './routes/content.js'
import { messagesRouter } from './routes/messages.js'
import { mailRouter } from './routes/mail.js'
import { sendMailRouter } from './routes/sendmail.js'

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
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY)

app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' })
  next()
})
app.use('/api', cors({ origin: config.corsOrigins }))
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
app.use('/api/send-mail', sendMailRouter())
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

// In production the built frontend is served from here too. It's one React Router app
// (portfolio at /, admin under /admin), so any other GET gets index.html and the router takes over.
if (existsSync(config.distDir)) {
  app.use('/admin', (req, res, next) => {
    res.set('X-Robots-Tag', 'noindex')
    next()
  })
  app.use(express.static(config.distDir))
  // Paths with an extension are files; a missing one should 404, not get HTML.
  app.get('/{*path}', (req, res, next) => (path.extname(req.path) ? next() : res.sendFile(path.join(config.distDir, 'index.html'))))
}

app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, details: err.details })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' })
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' })
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
