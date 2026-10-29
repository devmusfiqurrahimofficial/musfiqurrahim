// On a static-only deploy there's no API to post to, so fall back to the visitor's mail app.
import { createAsyncThunk } from '@reduxjs/toolkit'
import { errorDetails, errorMessage } from '../api/apiErrors.js'
import { selectProfile } from '../content/contentSelectors.js'
import { contactApi } from './contactApi.js'

// FETCH_ERROR: nothing answered. PARSING_ERROR: something answered, but not with JSON (a static host).
const NO_API = ['FETCH_ERROR', 'PARSING_ERROR']

export const submitContactForm = createAsyncThunk('contact/submit', async (form, { dispatch, getState, rejectWithValue }) => {
  const result = await dispatch(contactApi.endpoints.sendMessage.initiate(form))
  if (!result.error) return 'sent'

  if (NO_API.includes(result.error.status)) {
    const { email } = selectProfile(getState())
    const subject = encodeURIComponent(`Portfolio message from ${form.name}`)
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    return 'mailto'
  }

  const details = Object.entries(errorDetails(result.error)).map(([field, msg]) => `${field} ${msg}`).join('; ')
  const message = errorMessage(result.error)
  return rejectWithValue(details ? `${message}: ${details}` : message)
})
