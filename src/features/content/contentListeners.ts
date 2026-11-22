import { startAppListening } from '@/store/listenerMiddleware'
import { API_URL } from '@/config/apiUrl'
import { appStarted } from '../app/appActions'
import { contentChanged, fetchPortfolio } from './contentThunks'

startAppListening({
  actionCreator: appStarted,
  effect: async (_action, { dispatch }) => {
    // Never fetch or open EventSource during server-side rendering
    if (typeof window === 'undefined') return

    const result = await dispatch(fetchPortfolio())
    if (fetchPortfolio.rejected.match(result) || !('EventSource' in window)) return

    const events = new EventSource(`${API_URL}/api/events`)
    events.addEventListener('content', () => dispatch(contentChanged()))
    let connected = false
    events.addEventListener('open', () => {
      if (connected) dispatch(contentChanged())
      connected = true
    })
  },
})

let inFlight: any = null
startAppListening({
  actionCreator: contentChanged,
  effect: async (_action, { cancelActiveListeners, delay, dispatch }) => {
    cancelActiveListeners()
    await delay(150)
    inFlight?.abort()
    inFlight = dispatch(fetchPortfolio())
  },
})
