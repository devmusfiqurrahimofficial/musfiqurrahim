import { createSelector } from '@reduxjs/toolkit'
import type { Message } from '@/types/models'
import { messagesApi } from './messagesApi'

const selectGetMessagesResult = messagesApi.endpoints.getMessages.select()

export const selectAllMessages = createSelector(
  [selectGetMessagesResult],
  (result): Message[] => result?.data ?? []
)

export const selectUnreadCount = createSelector(
  [selectAllMessages],
  (messages) => messages.filter((m) => !m.read).length
)

export const selectMessagesByFilter = createSelector(
  [selectAllMessages, (_state: any, filter: string) => filter],
  (messages, filter) => (filter === 'unread' ? messages.filter((m) => !m.read) : messages)
)
