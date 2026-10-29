// The server sends a `content` event on /api/events after every admin save.
import { startAppListening } from '../../store/listenerMiddleware.js'
import { API_URL } from '../../config/apiUrl.js'
import { appStarted } from '../app/appActions.js'
import { contentChanged, fetchPortfolio } from './contentThunks.js'

startAppListening({
  actionCreator: appStarted,
  effect: async (action, { dispatch }) => {
    const result = await dispatch(fetchPortfolio())
    if (fetchPortfolio.rejected.match(result) || !('EventSource' in window)) return

    const events = new EventSource(`${API_URL}/api/events`)
    events.addEventListener('content', () => dispatch(contentChanged()))
    // EventSource reconnects on its own (e.g. after an API restart), but anything saved while it
    // was down never sent an event. So refetch on every reconnect, just not the first connect.
    let connected = false
    events.addEventListener('open', () => {
      if (connected) dispatch(contentChanged())
      connected = true
    })
  },
})

// One save can fire several events; debounce them into one refetch.
let inFlight = null
startAppListening({
  actionCreator: contentChanged,
  effect: async (action, { cancelActiveListeners, delay, dispatch }) => {
    cancelActiveListeners()
    await delay(150)
    inFlight?.abort()
    inFlight = dispatch(fetchPortfolio())
  },
})
