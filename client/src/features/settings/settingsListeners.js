import { startAppListening } from '../../store/listenerMiddleware.js'
import { appStarted } from '../app/appActions.js'
import { selectIsDark } from './settingsSelectors.js'

function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#142c40' : '#2d597b')
}

startAppListening({
  predicate: (action, current, previous) => appStarted.match(action) || selectIsDark(current) !== selectIsDark(previous),
  effect: (action, { getState }) => applyTheme(selectIsDark(getState())),
})
