// One entity per app: { id, open, minimized, maximized, z, x, y, w, h }. Focus = bump z past zTop.
// Anything that needs the screen size is worked out in windowsThunks.js and passed in.
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import { APP_LIST } from './appList.js'

export const windowsAdapter = createEntityAdapter()

const closedWindow = ({ id, w, h }) => ({ id, open: false, minimized: false, maximized: false, z: 0, x: 0, y: 0, w, h })

export const windowsSlice = createSlice({
  name: 'windows',
  initialState: windowsAdapter.getInitialState({ zTop: 10, bouncing: null }, APP_LIST.map(closedWindow)),
  reducers: {
    // rect is only used if the window was closed; an open one just gets restored and raised
    windowOpened: (state, { payload: { id, rect } }) => {
      const win = state.entities[id]
      if (!win.open) Object.assign(win, rect, { open: true })
      win.minimized = false
      win.z = ++state.zTop
    },
    windowFocused: (state, { payload: id }) => {
      const win = state.entities[id]
      if (win.z !== state.zTop) win.z = ++state.zTop
    },
    windowClosed: (state, { payload: id }) => {
      windowsAdapter.updateOne(state, { id, changes: { open: false, minimized: false, maximized: false } })
    },
    allWindowsClosed: (state) => {
      windowsAdapter.updateMany(
        state,
        state.ids.map((id) => ({ id, changes: { open: false, minimized: false, maximized: false } }))
      )
    },
    windowMinimized: (state, { payload: id }) => {
      windowsAdapter.updateOne(state, { id, changes: { minimized: true } })
    },
    windowMaximizeToggled: (state, { payload: id }) => {
      state.entities[id].maximized = !state.entities[id].maximized
    },
    windowMoved: (state, { payload: { id, x, y } }) => {
      windowsAdapter.updateOne(state, { id, changes: { x, y } })
    },
    bounceStarted: (state, { payload: id }) => {
      state.bouncing = id
    },
    bounceEnded: (state, { payload: id }) => {
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
