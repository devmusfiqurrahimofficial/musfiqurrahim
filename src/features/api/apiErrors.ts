export interface ApiErrorData {
  error?: string
  message?: string
  details?: Record<string, string>
}

export interface SerializedOrCustomError {
  status?: number | string
  data?: ApiErrorData | string
  message?: string
}

export function errorMessage(err: unknown): string {
  if (!err) return 'Something went wrong.'
  if (typeof err === 'string') return err
  const e = err as SerializedOrCustomError
  if (typeof e.data === 'string') return e.data
  if (e.data && typeof e.data === 'object') {
    if (e.data.error) return e.data.error
    if (e.data.message) return e.data.message
  }
  return e.message || 'Something went wrong.'
}

export function errorDetails(err: unknown): Record<string, string> {
  if (!err || typeof err !== 'object') return {}
  const e = err as SerializedOrCustomError
  if (e.data && typeof e.data === 'object' && e.data.details) {
    return e.data.details
  }
  return {}
}

export function isAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as SerializedOrCustomError
  return e.status === 401 || e.status === 403
}
