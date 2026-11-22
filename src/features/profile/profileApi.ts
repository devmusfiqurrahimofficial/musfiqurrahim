import { apiSlice } from '../api/apiSlice'
import type { Profile } from '@/types/models'

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getProfile: build.query<Profile, void>({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: build.mutation<Profile, Partial<Profile>>({
      query: (profile) => ({ url: '/profile', method: 'PUT', body: profile }),
      invalidatesTags: (_result, error) => (error ? [] : ['Profile']),
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi
