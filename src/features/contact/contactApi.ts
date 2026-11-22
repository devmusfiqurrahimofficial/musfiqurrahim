import { apiSlice } from '../api/apiSlice'
import type { MessageInput } from '@/types/models'

export const contactApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    sendMessage: build.mutation<{ ok: boolean }, MessageInput>({
      query: (message) => ({ url: '/messages', method: 'POST', body: message }),
    }),
  }),
})

export const { useSendMessageMutation } = contactApi
