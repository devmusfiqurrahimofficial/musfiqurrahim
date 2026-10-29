import { createSelector } from '@reduxjs/toolkit'
import { messagesAdapter, messagesApi } from './messagesApi.js'

const selectMessagesResult = messagesApi.endpoints.getMessages.select()
const EMPTY = messagesAdapter.getInitialState()
const selectMessagesData = createSelector([selectMessagesResult], (result) => result.data ?? EMPTY)

export const { selectAll: selectAllMessages } = messagesAdapter.getSelectors(selectMessagesData)

export const selectUnreadMessages = createSelector([selectAllMessages], (messages) => messages.filter((m) => !m.read))
export const selectUnreadCount = createSelector([selectUnreadMessages], (unread) => unread.length)

// filter: 'all' | 'unread'
export const selectMessagesByFilter = createSelector(
  [selectAllMessages, selectUnreadMessages, (state, filter) => filter],
  (all, unread, filter) => (filter === 'unread' ? unread : all)
)
