import { startAppListening } from '../../store/listenerMiddleware.js'
import { selectWindowById } from './windowsSelectors.js'
import { bounceEnded, bounceStarted, windowOpened } from './windowsSlice.js'

const BOUNCE_MS = 900

startAppListening({
  actionCreator: windowOpened,
  effect: async ({ payload: { id } }, { delay, dispatch, getOriginalState }) => {
    // only bounce on launch, not when restoring one that's already running
    if (selectWindowById(getOriginalState(), id).open) return
    dispatch(bounceStarted(id))
    await delay(BOUNCE_MS)
    dispatch(bounceEnded(id))
  },
})

