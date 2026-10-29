// The server picks the recipient (the profile's email) and sends it back as `to`.
import { apiSlice } from '../api/apiSlice.js'

export const mailApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    sendMail: build.mutation({
      query: (body) => ({ url: '/mail', method: 'POST', body }),
    }),
  }),
})

export const { useSendMailMutation } = mailApi
