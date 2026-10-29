import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { config } from '../config/index.js'
import { HttpError } from '../utils/validation.js'

// Verifying ID tokens only needs the project id (Google's public signing keys are fetched
// and cached by the SDK), so no service-account credentials are required.
const firebaseAuth = getAuth(initializeApp({ projectId: config.firebaseProjectId }))

// A valid token only proves who someone is. Being allowed to edit is decided here.
// Emails count only once Firebase has verified them, so nobody can claim an address they don't own.
export function isAdmin(claims) {
  if (config.adminUids.includes(claims.uid)) return true
  return Boolean(claims.email && claims.email_verified && config.adminEmails.includes(claims.email.toLowerCase()))
}

export async function requireAuth(req, res, next) {
  // Already checked by the global write guard in index.js.
  if (req.user) return next()
  const [scheme, token] = (req.get('authorization') || '').split(' ')
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Sign in to continue')

  let claims
  try {
    claims = await firebaseAuth.verifyIdToken(token)
  } catch (err) {
    throw new HttpError(401, err.code === 'auth/id-token-expired' ? 'Your session expired, sign in again' : 'Invalid session')
  }

  if (!isAdmin(claims)) {
    const hint = claims.email && !claims.email_verified ? ' Verify your email address first.' : ''
    throw new HttpError(403, `${claims.email || 'This account'} isn't allowed to edit this site.${hint}`)
  }
  req.user = {
    uid: claims.uid,
    email: claims.email ?? null,
    name: claims.name ?? null,
    picture: claims.picture ?? null,
    provider: claims.firebase?.sign_in_provider ?? null,
  }
  next()
}
