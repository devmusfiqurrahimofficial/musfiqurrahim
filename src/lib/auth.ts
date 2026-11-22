import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import type { AuthUser } from '@/types/models'
import { HttpError } from './validation'

const list = (value?: string, normalize: (s: string) => string = (s) => s): string[] =>
  (value || '')
    .split(',')
    .map((s) => normalize(s.trim()))
    .filter(Boolean)

function getFirebaseAdminAuth() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT

    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson)
        initializeApp({ credential: cert(parsed), projectId })
      } catch {
        initializeApp(projectId ? { projectId } : undefined)
      }
    } else if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      })
    } else {
      initializeApp(projectId ? { projectId } : undefined)
    }
  }
  return getAuth()
}

export function isAdmin(claims: { uid: string; email?: string; email_verified?: boolean }): boolean {
  const adminUids = list(process.env.ADMIN_UIDS)
  const adminEmails = list(process.env.ADMIN_EMAILS, (s) => s.toLowerCase())

  if (adminUids.includes(claims.uid)) return true
  return Boolean(claims.email && claims.email_verified && adminEmails.includes(claims.email.toLowerCase()))
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get('authorization') || ''
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Sign in to continue')
  }

  let claims
  try {
    const auth = getFirebaseAdminAuth()
    claims = await auth.verifyIdToken(token)
  } catch (err: unknown) {
    const error = err as { code?: string }
    throw new HttpError(
      401,
      error?.code === 'auth/id-token-expired' ? 'Your session expired, sign in again' : 'Invalid session'
    )
  }

  if (!isAdmin(claims)) {
    const hint = claims.email && !claims.email_verified ? ' Verify your email address first.' : ''
    throw new HttpError(403, `${claims.email || 'This account'} isn't allowed to edit this site.${hint}`)
  }

  return {
    uid: claims.uid,
    email: claims.email ?? null,
    name: claims.name ?? null,
    picture: claims.picture ?? null,
    provider: (claims.firebase?.sign_in_provider as string) ?? null,
  }
}
