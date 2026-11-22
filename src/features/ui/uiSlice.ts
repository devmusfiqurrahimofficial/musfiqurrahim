import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export const MOBILE_QUERY = '(max-width: 767px)'

export interface UiState {
  isMobile: boolean
}

// Initial state must be deterministic between SSR and client initial hydration
const initialState: UiState = {
  isMobile: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    mobileChanged: (state, { payload }: PayloadAction<boolean>) => {
      state.isMobile = payload
    },
  },
  selectors: {
    selectIsMobile: (state) => state.isMobile,
  },
})

export const { mobileChanged } = uiSlice.actions
export const { selectIsMobile } = uiSlice.selectors
