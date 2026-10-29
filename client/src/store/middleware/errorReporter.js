// A throw inside a reducer otherwise gives a stack trace with no clue which action caused it.
export const errorReporter = () => (next) => (action) => {
  try {
    return next(action)
  } catch (err) {
    console.error(`[store] "${action?.type}" threw:`, err)
    throw err
  }
}
