// Testing a slice and its selectors: reducers are pure functions, so call them with an action and
// check the state; selectors take a { windows } root state.
import { describe, expect, it } from 'vitest'
import { selectActiveId, selectActiveTitle } from './windowsSelectors.js'
import { allWindowsClosed, windowClosed, windowFocused, windowMinimized, windowOpened, windowsSlice } from './windowsSlice.js'

const reduce = (...actions) => actions.reduce(windowsSlice.reducer, undefined)
const root = (windows) => ({ windows })
const rect = { x: 10, y: 40, w: 300, h: 200 }

describe('windowsSlice', () => {
  it('starts with every app closed and nothing active', () => {
    const state = reduce({ type: '@@init' })
    expect(state.ids).toEqual(['about', 'projects', 'terminal', 'skills', 'contact'])
    expect(Object.values(state.entities).every((w) => !w.open)).toBe(true)
    expect(selectActiveId(root(state))).toBeNull()
    expect(selectActiveTitle(root(state))).toBe('Finder')
  })

  it('opens a window at the given rect and raises it to the top', () => {
    const state = reduce(windowOpened({ id: 'about', rect }), windowOpened({ id: 'skills', rect }))
    expect(state.entities.about).toMatchObject({ open: true, ...rect, z: 11 })
    expect(state.entities.skills.z).toBe(12)
    expect(selectActiveId(root(state))).toBe('skills')
  })

  it('restoring an open window keeps its place', () => {
    const moved = { x: 99, y: 99, w: 300, h: 200 }
    const state = reduce(windowOpened({ id: 'about', rect }), windowMinimized('about'), windowOpened({ id: 'about', rect: moved }))
    expect(state.entities.about).toMatchObject({ open: true, minimized: false, x: 10, y: 40 })
  })

  it('focus moves the active window; minimized windows are never active', () => {
    let state = reduce(windowOpened({ id: 'about', rect }), windowOpened({ id: 'skills', rect }), windowFocused('about'))
    expect(selectActiveId(root(state))).toBe('about')
    state = windowsSlice.reducer(state, windowMinimized('about'))
    expect(selectActiveId(root(state))).toBe('skills')
  })

  it('closes one window or all of them', () => {
    let state = reduce(windowOpened({ id: 'about', rect }), windowOpened({ id: 'skills', rect }), windowClosed('skills'))
    expect(state.entities.skills.open).toBe(false)
    state = windowsSlice.reducer(state, allWindowsClosed())
    expect(selectActiveId(root(state))).toBeNull()
  })

  it('selectActiveId is memoized: same input state, same result object', () => {
    const state = root(reduce(windowOpened({ id: 'about', rect })))
    selectActiveId.resetRecomputations()
    selectActiveId(state)
    selectActiveId(state)
    expect(selectActiveId.recomputations()).toBe(1)
  })
})
