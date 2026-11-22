import { createSlice } from '@reduxjs/toolkit'
import { submitContactForm } from './contactThunks'

const TEXT: Record<string, string> = {
  sent: "Thanks! Your message is on its way. I'll get back to you soon.",
  mailto: 'Your mail app should open with the message ready.',
}

export interface ContactState {
  state: 'idle' | 'sending' | 'sent' | 'mailto' | 'error'
  text: string
}

const initialState: ContactState = { state: 'idle', text: '' }

export const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(submitContactForm.pending, () => ({ state: 'sending' as const, text: '' }))
      .addCase(submitContactForm.fulfilled, (state, { payload }) => ({
        state: payload,
        text: TEXT[payload] || '',
      }))
      .addCase(submitContactForm.rejected, (state, { payload, error }) => ({
        state: 'error' as const,
        text: (payload as string) ?? error.message ?? 'Failed to send message',
      })),
  selectors: {
    selectContactStatus: (state) => state,
  },
})

export const { selectContactStatus } = contactSlice.selectors
