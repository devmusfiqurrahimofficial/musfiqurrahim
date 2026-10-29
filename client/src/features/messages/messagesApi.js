// The sidebar badge and the Messages page share this one cache entry, which is how marking
// something read on the page updates the badge.
import { createEntityAdapter } from '@reduxjs/toolkit'
import { apiSlice } from '../api/apiSlice.js'

export const messagesAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

const optimistic = (recipe) => async (arg, { dispatch, queryFulfilled }) => {
  const patch = dispatch(messagesApi.util.updateQueryData('getMessages', undefined, (draft) => recipe(draft, arg)))
  try {
    await queryFulfilled
  } catch {
    patch.undo()
  }
}

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getMessages: build.query({
      query: () => '/messages',
      transformResponse: (list) => messagesAdapter.setAll(messagesAdapter.getInitialState(), list),
      providesTags: (result) => [{ type: 'Message', id: 'LIST' }, ...(result?.ids ?? []).map((id) => ({ type: 'Message', id }))],
    }),
    setMessageRead: build.mutation({
      query: ({ id, read }) => ({ url: `/messages/${id}`, method: 'PATCH', body: { read } }),
      onQueryStarted: optimistic((draft, { id, read }) => messagesAdapter.updateOne(draft, { id, changes: { read } })),
    }),
    deleteMessage: build.mutation({
      query: (id) => ({ url: `/messages/${id}`, method: 'DELETE' }),
      onQueryStarted: optimistic((draft, id) => messagesAdapter.removeOne(draft, id)),
    }),
  }),
})

export const { useGetMessagesQuery, useSetMessageReadMutation, useDeleteMessageMutation } = messagesApi
