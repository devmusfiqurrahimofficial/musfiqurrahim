import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_URL } from '@/config/apiUrl'
import type { AppExtraArguments } from '@/types/store'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api`,
    prepareHeaders: async (headers, { extra }) => {
      const extraArgs = extra as AppExtraArguments
      const token = await extraArgs?.getIdToken?.()
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Project', 'SkillGroup', 'Command', 'Profile', 'Tools', 'Message'],
  endpoints: () => ({}),
})
