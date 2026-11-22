import { apiSlice } from '../api/apiSlice'

export const uploadsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    uploadFile: build.mutation<{ url: string }, FormData>({
      query: (formData) => ({ url: '/uploads', method: 'POST', body: formData }),
    }),
  }),
})

export const { useUploadFileMutation } = uploadsApi
