import { startAppListening } from '@/store/listenerMiddleware'
import { appStarted } from '../app/appActions'
import { selectIsDark } from './settingsSelectors'

function applyTheme(dark: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#142c40' : '#2d597b')
}

startAppListening({
  predicate: (action, current, previous) =>
    appStarted.match(action) || selectIsDark(current) !== selectIsDark(previous),
  effect: (_action, { getState }) => applyTheme(selectIsDark(getState())),
})
