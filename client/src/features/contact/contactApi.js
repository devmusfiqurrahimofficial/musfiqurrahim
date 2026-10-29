// Invalidating Message:LIST only matters if the admin's Messages page is open in this same browser.
import { apiSlice } from '../api/apiSlice.js'

export const contactApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    sendMessage: build.mutation({
      query: (body) => ({ url: '/messages', method: 'POST', body }),
      invalidatesTags: (result, error) => (error ? [] : [{ type: 'Message', id: 'LIST' }]),
    }),
  }),
})
