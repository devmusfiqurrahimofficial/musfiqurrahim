import type { AppDispatch, RootState } from '@/types/store'
import type { WindowId, WindowRect } from '@/types/window'
import { APP_LIST } from './appList'
import { DOCK_SPACE, MENU_H } from './layout'
import { selectActiveId, selectWindowById } from './windowsSelectors'
import { windowClosed, windowMinimized, windowOpened } from './windowsSlice'

function placeWindow(id: WindowId): WindowRect {
  const index = APP_LIST.findIndex((a) => a.id === id)
  const app = APP_LIST[index]
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800
  const w = Math.min(app.w, winW - 40)
  const h = Math.min(app.h, winH - MENU_H - DOCK_SPACE - 24)
  const x = Math.max(20, (winW - w) / 2 + (index - 2) * 36)
  const y = Math.max(MENU_H + 12, (winH - DOCK_SPACE - h) / 2 + (index - 2) * 24)
  return { x, y, w, h }
}

export const openApp = (id: WindowId) => (dispatch: AppDispatch, getState: () => RootState) => {
  const win = selectWindowById(getState() as any, id)
  const rect = win?.open ? undefined : placeWindow(id)
  dispatch(windowOpened({ id, rect }))
}

export const closeActiveWindow = () => (dispatch: AppDispatch, getState: () => RootState) => {
  const id = selectActiveId(getState() as any)
  if (id) dispatch(windowClosed(id))
}

export const minimizeActiveWindow = () => (dispatch: AppDispatch, getState: () => RootState) => {
  const id = selectActiveId(getState() as any)
  if (id) dispatch(windowMinimized(id))
}
