import { apiSlice } from '../api/apiSlice.js'

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getProfile: build.query({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: build.mutation({
      query: (profile) => ({ url: '/profile', method: 'PUT', body: profile }),
      invalidatesTags: (result, error) => (error ? [] : ['Profile']),
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi
