import { createSelector } from '@reduxjs/toolkit'
import { APP_LIST } from './appList.js'
import { windowsAdapter } from './windowsSlice.js'

export const {
  selectAll: selectAllWindows,
  selectById: selectWindowById,
  selectEntities: selectWindowEntities,
} = windowsAdapter.getSelectors((state) => state.windows)

export const selectBouncing = (state) => state.windows.bouncing

export const selectActiveId = createSelector([selectAllWindows], (windows) => {
  let active = null
  for (const w of windows) if (w.open && !w.minimized && (!active || w.z > active.z)) active = w
  return active?.id ?? null
})

export const selectActiveTitle = createSelector([selectActiveId], (id) => APP_LIST.find((a) => a.id === id)?.title ?? 'Finder')
