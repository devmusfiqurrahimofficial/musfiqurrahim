import { createSlice } from '@reduxjs/toolkit'
import type { PortfolioData } from '@/types/models'
import { fetchPortfolio } from './contentThunks'

export interface ContentState {
  data: PortfolioData | null
  status: 'idle' | 'loading' | 'live' | 'offline'
}

const initialState: ContentState = { data: null, status: 'idle' }

export const contentSlice = createSlice({
  name: 'content',
  initialState,
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
        if (!meta.aborted) state.status = 'offline'
      }),
})
