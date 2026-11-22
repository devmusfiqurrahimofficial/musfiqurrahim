import type { Middleware } from '@reduxjs/toolkit'

// A throw inside a reducer otherwise gives a stack trace with no clue which action caused it.
export const errorReporter: Middleware = () => (next) => (action) => {
  try {
    return next(action)
  } catch (err) {
    console.error(`[store] "${(action as { type?: string })?.type}" threw:`, err)
    throw err
  }
}
