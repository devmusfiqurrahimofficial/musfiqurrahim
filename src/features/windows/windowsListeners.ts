import { startAppListening } from '@/store/listenerMiddleware'
import { selectWindowById } from './windowsSelectors'
import { bounceEnded, bounceStarted, windowOpened } from './windowsSlice'

const BOUNCE_MS = 900

startAppListening({
  actionCreator: windowOpened,
  effect: async ({ payload: { id } }, { delay, dispatch, getOriginalState }) => {
    const orig = selectWindowById(getOriginalState() as any, id)
    if (orig?.open) return
    dispatch(bounceStarted(id))
    await delay(BOUNCE_MS)
    dispatch(bounceEnded(id))
  },
})
