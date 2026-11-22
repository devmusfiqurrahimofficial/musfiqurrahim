import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { store } from '@/store'
import type { rootReducer } from '@/store/rootReducer'

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = typeof store
export type AppDispatch = AppStore['dispatch']

export interface AppExtraArguments {
  getIdToken: () => Promise<string | null>
}

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  AppExtraArguments,
  UnknownAction
>
