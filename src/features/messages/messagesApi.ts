import { createEntityAdapter } from '@reduxjs/toolkit'
import { apiSlice } from '../api/apiSlice'
import type { Message } from '@/types/models'

export const messagesAdapter = createEntityAdapter<Message>()

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getMessages: build.query<Message[], void>({
      query: () => '/messages',
      providesTags: (result = []) => [
        { type: 'Message' as const, id: 'LIST' },
        ...result.map(({ id }) => ({ type: 'Message' as const, id: id || '' })),
      ],
    }),
    setMessageRead: build.mutation<Message, { id: string; read: boolean }>({
      query: ({ id, read }) => ({ url: `/messages/${id}`, method: 'PATCH', body: { read } }),
      async onQueryStarted({ id, read }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          messagesApi.util.updateQueryData('getMessages', undefined, (draft) => {
            const item = draft.find((m) => m.id === id)
            if (item) item.read = read
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),
    deleteMessage: build.mutation<void, string>({
      query: (id) => ({ url: `/messages/${id}`, method: 'DELETE' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          messagesApi.util.updateQueryData('getMessages', undefined, (draft) => {
            const index = draft.findIndex((m) => m.id === id)
            if (index !== -1) draft.splice(index, 1)
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),
  }),
})

export const { useGetMessagesQuery, useSetMessageReadMutation, useDeleteMessageMutation } = messagesApi
