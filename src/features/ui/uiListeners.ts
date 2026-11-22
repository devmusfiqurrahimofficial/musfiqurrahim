import { startAppListening } from '@/store/listenerMiddleware'
import { appStarted } from '../app/appActions'
import { MOBILE_QUERY, mobileChanged } from './uiSlice'

startAppListening({
  actionCreator: appStarted,
  effect: (_action, { dispatch }) => {
    if (typeof window === 'undefined') return
    const watch = (query: string, actionCreator: any) => {
      const mq = window.matchMedia(query)
      dispatch(actionCreator(mq.matches))
      mq.addEventListener('change', (e) => dispatch(actionCreator(e.matches)))
    }
    watch(MOBILE_QUERY, mobileChanged)
  },
})
