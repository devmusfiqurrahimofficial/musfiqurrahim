// The server sends failures as { error, details }; details maps field -> message for the forms.

export function errorMessage(error) {
  if (!error) return ''
  if (error.status === 'FETCH_ERROR') return "Can't reach the server. Is it running?"
  return error.data?.error || error.message || error.error || `Request failed (${error.status})`
}

const NO_DETAILS = {}
export const errorDetails = (error) => error?.data?.details ?? NO_DETAILS

export const isAuthError = (error) => error?.status === 401 || error?.status === 403
