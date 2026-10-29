// Empty on purpose: each feature adds its endpoints with injectEndpoints in its own *Api.js.
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_URL } from '../../config/apiUrl.js'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
    // Token comes in via `extra` so this file doesn't drag Firebase into the visitor bundle.
    // Firebase refreshes it (they last an hour), so ask every time.
    prepareHeaders: async (headers, { extra }) => {
      const token = await extra.getIdToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Project', 'SkillGroup', 'Command', 'Profile', 'Tools', 'Message'],
  endpoints: () => ({}),
})
