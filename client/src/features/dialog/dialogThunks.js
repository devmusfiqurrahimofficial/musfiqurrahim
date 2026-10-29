// Usage: if (!(await dispatch(confirm({ title, message })))) return
// The answer comes back through a one-off listener that removes itself. Signing out counts as "no".
import { nanoid } from '@reduxjs/toolkit'
import { addAppListener } from '../../store/listenerMiddleware.js'
import { signedOut } from '../auth/authActions.js'
import { confirmOpened, confirmSettled } from './dialogSlice.js'

export const confirm = (options) => (dispatch) =>
  new Promise((resolve) => {
    const id = nanoid()
    dispatch(
      addAppListener({
        predicate: (action) => (confirmSettled.match(action) && action.payload.id === id) || signedOut.match(action),
        effect: (action, { unsubscribe }) => {
          unsubscribe()
          resolve(confirmSettled.match(action) && action.payload.ok)
        },
      })
    )
    dispatch(confirmOpened({ id, ...options }))
  })
