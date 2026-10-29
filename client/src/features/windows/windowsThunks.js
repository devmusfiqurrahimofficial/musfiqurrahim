// openApp is the one way to launch or restore a window.
import { APP_LIST } from './appList.js'
import { DOCK_SPACE, MENU_H } from './layout.js'
import { selectActiveId, selectWindowById } from './windowsSelectors.js'
import { windowClosed, windowMinimized, windowOpened } from './windowsSlice.js'

// centred, then nudged per app so they don't stack exactly on top of each other
function placeWindow(id) {
  const index = APP_LIST.findIndex((a) => a.id === id)
  const app = APP_LIST[index]
  const w = Math.min(app.w, window.innerWidth - 40)
  const h = Math.min(app.h, window.innerHeight - MENU_H - DOCK_SPACE - 24)
  const x = Math.max(20, (window.innerWidth - w) / 2 + (index - 2) * 36)
  const y = Math.max(MENU_H + 12, (window.innerHeight - DOCK_SPACE - h) / 2 + (index - 2) * 24)
  return { x, y, w, h }
}

export const openApp = (id) => (dispatch, getState) => {
  const rect = selectWindowById(getState(), id).open ? undefined : placeWindow(id)
  dispatch(windowOpened({ id, rect }))
}

export const closeActiveWindow = () => (dispatch, getState) => {
  const id = selectActiveId(getState())
  if (id) dispatch(windowClosed(id))
}

export const minimizeActiveWindow = () => (dispatch, getState) => {
  const id = selectActiveId(getState())
  if (id) dispatch(windowMinimized(id))
}
