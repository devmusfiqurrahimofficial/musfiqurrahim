import type { ErrorsState } from './errorsReducer'

export const selectErrors = (state: { errors: ErrorsState }) => state.errors.items
