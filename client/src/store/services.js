// Thunks and RTK Query get this as `extra`. The admin swaps in the real getIdToken
// once Firebase has loaded; visitors never send a token.
export const services = {
  getIdToken: async () => null,
}
