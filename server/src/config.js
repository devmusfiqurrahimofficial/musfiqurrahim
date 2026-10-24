import { fileURLToPath } from 'node:url'
import path from 'node:path'

const serverRoot = fileURLToPath(new URL('..', import.meta.url))
const isProd = process.env.NODE_ENV === 'production'

const list = (value, normalize = (s) => s) =>
  (value || '')
    .split(',')
    .map((s) => normalize(s.trim()))
    .filter(Boolean)

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio'
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID
const adminEmails = list(process.env.ADMIN_EMAILS, (s) => s.toLowerCase())
const adminUids = list(process.env.ADMIN_UIDS)

// Any Google account can get a valid Firebase token for the project, so refuse to start without an allowlist.
if (!firebaseProjectId) throw new Error('Set FIREBASE_PROJECT_ID in server/.env.')
if (!adminEmails.length && !adminUids.length) throw new Error('Set ADMIN_EMAILS and/or ADMIN_UIDS in server/.env to say who may use the admin panel.')

export const config = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  firebaseProjectId,
  adminEmails,
  adminUids,
  corsOrigins: list(process.env.CORS_ORIGIN || 'http://localhost:5173'),
  mongoUri,
  // Atlas URIs usually end in "/" with no database name, where the driver would fall back to "test".
  mongoDbName: process.env.MONGODB_DB || (/^mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(mongoUri) ? undefined : 'portfolio'),
  // The pre-MongoDB JSON store; imported once if the database starts empty.
  legacyDataFile: path.resolve(serverRoot, 'data/db.json'),
  distDir: path.resolve(serverRoot, '../dist'),
}
