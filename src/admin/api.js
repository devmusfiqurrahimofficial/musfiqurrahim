import { API_URL } from '../apiUrl.js'
import { auth } from './firebase.js'

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

export async function api(path, { method = 'GET', body } = {}) {
  // Firebase refreshes the ID token itself (they last an hour), so ask for it on every request.
  const token = await auth?.currentUser?.getIdToken()
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, "Can't reach the server. Is it running?")
  }

  if (res.status === 204) return null
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    // Rejected or not allowed: the whole session is over, not just this request.
    if (token && (res.status === 401 || res.status === 403)) onUnauthorized(json?.error)
    throw new ApiError(res.status, json?.error || `Request failed (${res.status})`, json?.details)
  }
  return json
}
