import { createAction, createAsyncThunk } from '@reduxjs/toolkit'
import { API_URL } from '@/config/apiUrl'
import type { PortfolioData } from '@/types/models'

const looksValid = (d: any): boolean =>
  d && d.profile && Array.isArray(d.projects) && Array.isArray(d.skills) && Array.isArray(d.tools)

export const fetchPortfolio = createAsyncThunk<PortfolioData, void>('content/fetch', async (_, { signal }) => {
  const res = await fetch(`${API_URL}/api/portfolio`, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`Portfolio request failed (${res.status})`)
  const json = await res.json()
  if (!looksValid(json)) throw new Error('The API did not return portfolio content')
  return { commands: [], ...json }
})

export const contentChanged = createAction('content/changed')
