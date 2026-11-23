import { useHydrated } from '@/lib/useHydrated'
import { useAppSelector } from '@/store/hooks'
import { selectIsMobile } from './uiSlice'

/**
 * `isMobile` is set from `matchMedia` on the client before React hydrates, but the server
 * always renders the desktop layout. Report `false` until hydration finishes so the first
 * client render matches the server HTML, then switch to the real value.
 */
export function useIsMobile(): boolean {
  const isMobile = useAppSelector(selectIsMobile)
  return useHydrated() && isMobile
}
