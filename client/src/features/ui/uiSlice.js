// Read once up front so the first render is right (uiListeners keeps them current after that).
// No window in tests, hence the typeof check.
import { createSlice } from '@reduxjs/toolkit'

export const MOBILE_QUERY = '(max-width: 767px)'
const matches = (query) => typeof window !== 'undefined' && window.matchMedia(query).matches

export const uiSlice = createSlice({
  name: 'ui',
  initialState: () => ({ isMobile: matches(MOBILE_QUERY) }),
  reducers: {
    mobileChanged: (state, { payload }) => {
      state.isMobile = payload
    },
  },
  selectors: {
    selectIsMobile: (state) => state.isMobile,
  },
})

export const { mobileChanged } = uiSlice.actions
export const { selectIsMobile } = uiSlice.selectors
