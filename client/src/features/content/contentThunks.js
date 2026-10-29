// Not RTK Query: this has to be persisted between visits and fall back to data.js,
// and RTK Query's cache isn't built for either.
import { createAction, createAsyncThunk } from '@reduxjs/toolkit'
import { API_URL } from '../../config/apiUrl.js'

const looksValid = (d) => d && d.profile && Array.isArray(d.projects) && Array.isArray(d.skills) && Array.isArray(d.tools)

export const fetchPortfolio = createAsyncThunk('content/fetch', async (_, { signal }) => {
  const res = await fetch(`${API_URL}/api/portfolio`, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`Portfolio request failed (${res.status})`)
  const json = await res.json()
  // a static host answers with index.html, so treat anything odd as "no API"
  if (!looksValid(json)) throw new Error('The API did not return portfolio content')
  return { commands: [], ...json }
})

export const contentChanged = createAction('content/changed')
