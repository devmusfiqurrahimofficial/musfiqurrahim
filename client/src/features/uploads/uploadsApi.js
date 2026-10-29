import { apiSlice } from '../api/apiSlice.js'

export const uploadsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    uploadFile: build.mutation({
      query: (formData) => ({ url: '/uploads', method: 'POST', body: formData }),
    }),
  }),
})
