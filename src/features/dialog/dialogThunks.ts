import { nanoid } from '@reduxjs/toolkit'
import { addAppListener } from '@/store/listenerMiddleware'
import type { AppDispatch } from '@/types/store'
import { signedOut } from '../auth/authActions'
import { confirmOpened, confirmSettled, type DialogOptions } from './dialogSlice'

export const confirm =
  (options: DialogOptions) =>
  (dispatch: AppDispatch): Promise<boolean> =>
    new Promise((resolve) => {
      const id = nanoid()
      dispatch(
        addAppListener({
          predicate: (action) =>
            (confirmSettled.match(action) && (action as any).payload?.id === id) || signedOut.match(action),
          effect: (action, { unsubscribe }) => {
            unsubscribe()
            resolve(confirmSettled.match(action) && Boolean((action as any).payload?.ok))
          },
        })
      )
      dispatch(confirmOpened({ id, ...options }))
    })
