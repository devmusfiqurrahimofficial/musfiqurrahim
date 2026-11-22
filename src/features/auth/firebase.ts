import { getApps, initializeApp } from 'firebase/app'
import { type Auth, getAuth } from 'firebase/auth'

const apiKey =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY) ||
  ''
const authDomain =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
  (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
  ''
const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_PROJECT_ID) ||
  ''
const appId =
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
  (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_APP_ID) ||
  ''

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  appId,
}

const ENV_NAMES: Record<string, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY (or VITE_FIREBASE_API_KEY)',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (or VITE_FIREBASE_AUTH_DOMAIN)',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID (or VITE_FIREBASE_PROJECT_ID)',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID (or VITE_FIREBASE_APP_ID)',
}

export const missingConfig = Object.keys(ENV_NAMES)
  .filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig])
  .map((key) => ENV_NAMES[key])

function getClientAuth(): Auth | null {
  if (missingConfig.length || typeof window === 'undefined') return null
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  return getAuth(app)
}

export const auth = getClientAuth()

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/invalid-email': 'That email address looks wrong.',
  'auth/user-disabled': 'This account has been disabled in Firebase.',
  'auth/too-many-requests': 'Too many attempts. Wait a bit, or reset your password.',
  'auth/network-request-failed': "Can't reach Firebase. Check your connection.",
  'auth/operation-not-allowed': "This sign-in method isn't enabled for the Firebase project (Authentication → Sign-in method).",
  'auth/unauthorized-domain': "This domain isn't in the Firebase project's Authorized domains (Authentication → Settings).",
  'auth/missing-email': 'Enter your email address first.',
}

export function authErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string }
  return (e?.code && MESSAGES[e.code]) || e?.message || 'Something went wrong.'
}
