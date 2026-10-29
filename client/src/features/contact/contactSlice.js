// Just the send status; the field values live in the form component.
import { createSlice } from '@reduxjs/toolkit'
import { submitContactForm } from './contactThunks.js'

const TEXT = {
  sent: "Thanks! Your message is on its way. I'll get back to you soon.",
  mailto: 'Your mail app should open with the message ready.',
}

export const contactSlice = createSlice({
  name: 'contact',
  // state: idle | sending | sent | mailto | error
  initialState: { state: 'idle', text: '' },
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(submitContactForm.pending, () => ({ state: 'sending', text: '' }))
      .addCase(submitContactForm.fulfilled, (state, { payload }) => ({ state: payload, text: TEXT[payload] }))
      .addCase(submitContactForm.rejected, (state, { payload, error }) => ({ state: 'error', text: payload ?? error.message })),
  selectors: {
    selectContactStatus: (state) => state,
  },
})

export const { selectContactStatus } = contactSlice.selectors
