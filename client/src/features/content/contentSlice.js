// `data` is persisted, so returning visitors get the DB's version straight away even while
// Render wakes up. Until the first successful fetch ever, selectors fall back to data.js.
import { createSlice } from '@reduxjs/toolkit'
import { fetchPortfolio } from './contentThunks.js'

export const contentSlice = createSlice({
  name: 'content',
  // idle | loading | live | offline (showing saved or bundled content)
  initialState: { data: null, status: 'idle' },
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading'
      })
      .addCase(fetchPortfolio.fulfilled, (state, { payload }) => {
        state.data = payload
        state.status = 'live'
      })
      .addCase(fetchPortfolio.rejected, (state, { meta }) => {
        // aborted = superseded by a newer refetch, not a failure
        if (!meta.aborted) state.status = 'offline'
      }),
})
