// Firebase says who's signed in; /api/auth/me says whether they're allowed in.
// Only the admin chunk imports this (keeps Firebase out of the visitor bundle).
import { createAsyncThunk } from '@reduxjs/toolkit'
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { API_URL } from '../../config/apiUrl.js'
import { services } from '../../store/services.js'
import { signedOut } from './authActions.js'
import { auth, authErrorMessage } from './firebase.js'

// see store/services.js
services.getIdToken = async () => (await auth?.currentUser?.getIdToken()) ?? null

export const verifySession = createAsyncThunk('auth/verifySession', async (_, { extra, rejectWithValue, signal }) => {
  const token = await extra.getIdToken()
  let res
  try {
    res = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, signal })
  } catch {
    return rejectWithValue("Can't reach the server. Is it running?")
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) return rejectWithValue(json?.error || `Request failed (${res.status})`)
  return json.user
})

// returns the unsubscribe, so it can go straight into a useEffect
export const watchAuthState = () => (dispatch) => {
  if (!auth) {
    dispatch(signedOut())
    return () => {}
  }
  return onAuthStateChanged(auth, (user) => dispatch(user ? verifySession() : signedOut()))
}

// reason (optional) ends up on the login screen
export const endSession = createAsyncThunk('auth/endSession', async (reason, { dispatch }) => {
  if (auth?.currentUser) await signOut(auth)
  dispatch(signedOut(reason))
})

export const signInWithPassword = createAsyncThunk('auth/signIn', async ({ email, password }, { rejectWithValue }) => {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  } catch (err) {
    return rejectWithValue(authErrorMessage(err))
  }
})

// Two reset thunks on purpose: the login form shows the result inline, Account shows a toast.
export const requestPasswordReset = createAsyncThunk('auth/requestPasswordReset', async (email, { rejectWithValue }) => {
  if (!email.trim()) return rejectWithValue('Enter your email address first.')
  try {
    await sendPasswordResetEmail(auth, email.trim())
    return email.trim()
  } catch (err) {
    return rejectWithValue(authErrorMessage(err))
  }
})

export const sendPasswordReset = createAsyncThunk('auth/sendPasswordReset', async (email, { rejectWithValue }) => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (err) {
    return rejectWithValue({ message: authErrorMessage(err), notify: true })
  }
})

export const copyUid = createAsyncThunk('auth/copyUid', async (uid, { rejectWithValue }) => {
  try {
    await navigator.clipboard.writeText(uid)
  } catch {
    return rejectWithValue({ message: "Couldn't copy; select it instead", notify: true })
  }
})
