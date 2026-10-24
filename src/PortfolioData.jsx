import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from './apiUrl.js'
import * as bundled from './data.js'

// data.js predates custom Terminal commands, so the bundled fallback has none.
const fallback = { commands: [], ...bundled }
const PortfolioContext = createContext(fallback)

const looksValid = (d) => d && d.profile && Array.isArray(d.projects) && Array.isArray(d.skills) && Array.isArray(d.tools)

// Renders straight away with the content bundled in data.js, then swaps in whatever the API serves.
// If the API is unreachable (e.g. a static-only deploy), the bundled content simply stays.
// Once the API has answered, it also listens on /api/events and refetches whenever the admin
// panel saves something, so edits appear without a reload.
export function PortfolioProvider({ children }) {
  const [data, setData] = useState(fallback)

  useEffect(() => {
    let ctrl = null
    let events = null
    let debounce = null

    const load = () => {
      ctrl?.abort()
      ctrl = new AbortController()
      return fetch(`${API_URL}/api/portfolio`, { signal: ctrl.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!looksValid(json)) return false
          setData({ commands: [], ...json })
          return true
        })
        .catch(() => false)
    }

    load().then((apiIsUp) => {
      if (!apiIsUp || ctrl.signal.aborted || !('EventSource' in window)) return
      events = new EventSource(`${API_URL}/api/events`)
      // A save can touch several things at once; refetch once they settle.
      events.addEventListener('content', () => {
        clearTimeout(debounce)
        debounce = setTimeout(load, 150)
      })
    })

    return () => {
      ctrl?.abort()
      events?.close()
      clearTimeout(debounce)
    }
  }, [])

  return <PortfolioContext.Provider value={data}>{children}</PortfolioContext.Provider>
}

export const usePortfolio = () => useContext(PortfolioContext)
