import { createSelector } from '@reduxjs/toolkit'
import type { WindowEntity, WindowId } from '@/types/window'
import { APP_LIST } from './appList'
import { windowsAdapter } from './windowsSlice'

export const {
  selectAll: selectAllWindows,
  selectById: selectWindowById,
  selectEntities: selectWindowEntities,
} = windowsAdapter.getSelectors((state: any) => state.windows)

export const selectBouncing = (state: any): WindowId | null => state.windows.bouncing

export const selectActiveId = createSelector([selectAllWindows], (windows: WindowEntity[]): WindowId | null => {
  let active: WindowEntity | null = null
  for (const w of windows) {
    if (w.open && !w.minimized && (!active || w.z > active.z)) active = w
  }
  return active?.id ?? null
})

export const selectActiveTitle = createSelector(
  [selectActiveId],
  (id): string => APP_LIST.find((a) => a.id === id)?.title ?? 'Finder'
)
