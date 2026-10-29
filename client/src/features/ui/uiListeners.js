import { startAppListening } from '../../store/listenerMiddleware.js'
import { appStarted } from '../app/appActions.js'
import { MOBILE_QUERY, mobileChanged } from './uiSlice.js'

startAppListening({
  actionCreator: appStarted,
  effect: (action, { dispatch }) => {
    const watch = (query, actionCreator) => {
      const mq = window.matchMedia(query)
      dispatch(actionCreator(mq.matches))
      mq.addEventListener('change', (e) => dispatch(actionCreator(e.matches)))
    }
    watch(MOBILE_QUERY, mobileChanged)
  },
})
