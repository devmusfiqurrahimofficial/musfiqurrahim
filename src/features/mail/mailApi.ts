import { apiSlice } from '../api/apiSlice'

export const mailApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    sendMail: build.mutation<{ ok: boolean; to: string }, { from: string; subject: string; message: string }>({
      query: (body) => ({ url: '/mail', method: 'POST', body }),
    }),
  }),
})

export const { useSendMailMutation } = mailApi
