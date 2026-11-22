import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { WindowEntity, WindowId, WindowRect } from '@/types/window'
import { APP_LIST } from './appList'

export const windowsAdapter = createEntityAdapter<WindowEntity>()

const closedWindow = ({ id, w, h }: { id: WindowId; w: number; h: number }): WindowEntity => ({
  id,
  open: false,
  minimized: false,
  maximized: false,
  z: 0,
  x: 0,
  y: 0,
  w,
  h,
})

export interface WindowsExtraState {
  zTop: number
  bouncing: WindowId | null
}

export const windowsSlice = createSlice({
  name: 'windows',
  initialState: windowsAdapter.getInitialState<WindowsExtraState>(
    { zTop: 10, bouncing: null },
    APP_LIST.map(closedWindow)
  ),
  reducers: {
    windowOpened: (state, { payload: { id, rect } }: PayloadAction<{ id: WindowId; rect?: WindowRect }>) => {
      const win = state.entities[id]
      if (win) {
        if (!win.open && rect) Object.assign(win, rect, { open: true })
        else win.open = true
        win.minimized = false
        win.z = ++state.zTop
      }
    },
    windowFocused: (state, { payload: id }: PayloadAction<WindowId>) => {
      const win = state.entities[id]
      if (win && win.z !== state.zTop) win.z = ++state.zTop
    },
    windowClosed: (state, { payload: id }: PayloadAction<WindowId>) => {
      windowsAdapter.updateOne(state, { id, changes: { open: false, minimized: false, maximized: false } })
    },
    allWindowsClosed: (state) => {
      windowsAdapter.updateMany(
        state,
        state.ids.map((id) => ({ id, changes: { open: false, minimized: false, maximized: false } }))
      )
    },
    windowMinimized: (state, { payload: id }: PayloadAction<WindowId>) => {
      windowsAdapter.updateOne(state, { id, changes: { minimized: true } })
    },
    windowMaximizeToggled: (state, { payload: id }: PayloadAction<WindowId>) => {
      const win = state.entities[id]
      if (win) win.maximized = !win.maximized
    },
    windowMoved: (state, { payload: { id, x, y } }: PayloadAction<{ id: WindowId; x: number; y: number }>) => {
      windowsAdapter.updateOne(state, { id, changes: { x, y } })
    },
    bounceStarted: (state, { payload: id }: PayloadAction<WindowId>) => {
      state.bouncing = id
    },
    bounceEnded: (state, { payload: id }: PayloadAction<WindowId>) => {
      if (state.bouncing === id) state.bouncing = null
    },
  },
})

export const {
  windowOpened,
  windowFocused,
  windowClosed,
  allWindowsClosed,
  windowMinimized,
  windowMaximizeToggled,
  windowMoved,
  bounceStarted,
  bounceEnded,
} = windowsSlice.actions
