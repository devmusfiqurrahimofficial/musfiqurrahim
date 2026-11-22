import { createAsyncThunk } from '@reduxjs/toolkit'
import type { MessageInput } from '@/types/models'
import type { RootState } from '@/types/store'
import { errorDetails, errorMessage } from '../api/apiErrors'
import { selectProfile } from '../content/contentSelectors'
import { contactApi } from './contactApi'

const NO_API = ['FETCH_ERROR', 'PARSING_ERROR', 404, 502, 503]

export const submitContactForm = createAsyncThunk<
  'sent' | 'mailto',
  MessageInput,
  { state: RootState }
>('contact/submit', async (form, { dispatch, getState, rejectWithValue }) => {
  const result = await dispatch(contactApi.endpoints.sendMessage.initiate(form))
  if (!result.error) return 'sent'

  const status = (result.error as any)?.status
  if (NO_API.includes(status)) {
    const { email } = selectProfile(getState())
    const subject = encodeURIComponent(`Portfolio message from ${form.name}`)
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)
    if (typeof window !== 'undefined') {
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    }
    return 'mailto'
  }

  const details = Object.entries(errorDetails(result.error))
    .map(([field, msg]) => `${field} ${msg}`)
    .join('; ')
  const message = errorMessage(result.error)
  return rejectWithValue(details ? `${message}: ${details}` : message)
})
