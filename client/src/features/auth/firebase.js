import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const env = import.meta.env

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const ENV_NAMES = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

// the login screen lists whatever's missing
export const missingConfig = Object.keys(ENV_NAMES)
  .filter((key) => !firebaseConfig[key])
  .map((key) => ENV_NAMES[key])

export const auth = missingConfig.length ? null : getAuth(initializeApp(firebaseConfig))

const MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/invalid-email': 'That email address looks wrong.',
  'auth/user-disabled': 'This account has been disabled in Firebase.',
  'auth/too-many-requests': 'Too many attempts. Wait a bit, or reset your password.',
  'auth/network-request-failed': "Can't reach Firebase. Check your connection.",
  'auth/operation-not-allowed': "This sign-in method isn't enabled for the Firebase project (Authentication → Sign-in method).",
  'auth/unauthorized-domain': "This domain isn't in the Firebase project's Authorized domains (Authentication → Settings).",
  'auth/missing-email': 'Enter your email address first.',
}

export function authErrorMessage(err) {
  return MESSAGES[err?.code] || err?.message || 'Something went wrong.'
}
