import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * `false` during SSR and the hydration render, `true` afterwards.
 * Use it to gate output that depends on client-only state (e.g. redux-persist
 * rehydrated from localStorage) so the first client render matches the server HTML.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
