import { createAsyncThunk } from '@reduxjs/toolkit'
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { API_URL } from '@/config/apiUrl'
import { services } from '@/store/services'
import type { AuthUser } from '@/types/models'
import type { AppDispatch, AppExtraArguments } from '@/types/store'
import { signedOut } from './authActions'
import { auth, authErrorMessage } from './firebase'

services.getIdToken = async () => (await auth?.currentUser?.getIdToken()) ?? null

export const verifySession = createAsyncThunk<AuthUser, void, { extra: AppExtraArguments }>(
  'auth/verifySession',
  async (_, { extra, rejectWithValue, signal }) => {
    const token = await extra.getIdToken()
    let res: Response
    try {
      res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
    } catch {
      return rejectWithValue("Can't reach the server. Is it running?")
    }
    const json = await res.json().catch(() => null)
    if (!res.ok) return rejectWithValue(json?.error || `Request failed (${res.status})`)
    return json.user
  }
)

export const watchAuthState = () => (dispatch: AppDispatch) => {
  if (!auth) {
    dispatch(signedOut())
    return () => {}
  }
  return onAuthStateChanged(auth, (user) => {
    dispatch(user ? verifySession() : signedOut())
  })
}

export const endSession = createAsyncThunk<void, string | undefined>(
  'auth/endSession',
  async (reason, { dispatch }) => {
    if (auth?.currentUser) await signOut(auth)
    dispatch(signedOut(reason))
  }
)

export const signInWithPassword = createAsyncThunk<void, { email: string; password: string }>(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    if (!auth) return rejectWithValue('Firebase is not configured')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      return rejectWithValue(authErrorMessage(err))
    }
  }
)

export const requestPasswordReset = createAsyncThunk<string, string>(
  'auth/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    if (!auth) return rejectWithValue('Firebase is not configured')
    if (!email.trim()) return rejectWithValue('Enter your email address first.')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      return email.trim()
    } catch (err) {
      return rejectWithValue(authErrorMessage(err))
    }
  }
)

export const sendPasswordReset = createAsyncThunk<void, string>(
  'auth/sendPasswordReset',
  async (email, { rejectWithValue }) => {
    if (!auth) return rejectWithValue({ message: 'Firebase is not configured', notify: true })
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      return rejectWithValue({ message: authErrorMessage(err), notify: true })
    }
  }
)

export const copyUid = createAsyncThunk<void, string>(
  'auth/copyUid',
  async (uid, { rejectWithValue }) => {
    try {
      await navigator.clipboard.writeText(uid)
    } catch {
      return rejectWithValue({ message: "Couldn't copy; select it instead", notify: true })
    }
  }
)
