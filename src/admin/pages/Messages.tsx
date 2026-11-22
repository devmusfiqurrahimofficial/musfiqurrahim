'use client'

import { useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import { confirm } from '@/features/dialog/dialogThunks'
import {
  useDeleteMessageMutation,
  useGetMessagesQuery,
  useSetMessageReadMutation,
} from '@/features/messages/messagesApi'
import { selectMessagesByFilter, selectUnreadCount } from '@/features/messages/messagesSelectors'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { Message } from '@/types/models'
import { Button, ErrorState, Loading, PageHeader, Panel } from '../ui'

const when = (iso: string | Date | undefined) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

export default function MessagesPage() {
  const dispatch = useAppDispatch()
  const { isLoading, isFetching, error, refetch } = useGetMessagesQuery(undefined, { pollingInterval: 30_000 })
  const [setMessageRead] = useSetMessageReadMutation()
  const [deleteMessage] = useDeleteMessageMutation()
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const shown = useAppSelector((state) => selectMessagesByFilter(state, filter))
  const unread = useAppSelector(selectUnreadCount)

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const setRead = (message: Message, read: boolean) => {
    if (message.id) setMessageRead({ id: message.id, read })
  }

  const open = (message: Message) => {
    setOpenId(openId === message.id ? null : message.id ?? null)
    if (!message.read) setRead(message, true)
  }

  const remove = async (message: Message) => {
    const ok = await dispatch(
      confirm({
        title: 'Delete message?',
        message: `The message from ${message.name} will be deleted.`,
        confirmLabel: 'Delete',
        danger: true,
      })
    )
    if (ok && message.id) deleteMessage(message.id)
  }

  return (
    <>
      <PageHeader
        title="Messages"
        description={`Sent from the Contact window. ${unread ? `${unread} unread.` : 'All caught up.'}`}
        actions={
          <>
            <div role="group" aria-label="Filter" className="flex rounded-xl bg-slate-900/[0.06] p-0.5 dark:bg-white/10">
              {['all', 'unread'].map((f) => (
                <button
                  key={f}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`rounded-[10px] px-3 py-1 text-xs font-medium capitalize transition ${
                    filter === f
                      ? 'bg-white text-slate-800 shadow-sm dark:bg-white/20 dark:text-white'
                      : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button variant="glass" size="sm" onClick={refetch} aria-label="Refresh">
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      />

      <div className="space-y-2">
        {shown.map((m) => (
          <Panel key={m.id} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => open(m)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${m.read ? 'bg-transparent' : 'bg-sky-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{m.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{m.email}</p>
                </div>
              </button>
              <span className="text-xs text-slate-400">{when(m.createdAt)}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete message from ${m.name}`}
                onClick={() => remove(m)}
                className="hover:!bg-rose-500/10 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {openId === m.id && (
              <div className="mt-3 border-t border-slate-900/5 pt-3 dark:border-white/10">
                <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-200">{m.message}</p>
                <div className="mt-3">
                  <a
                    href={`mailto:${m.email}?subject=Re:%20Portfolio%20Message`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
                  >
                    Reply via email
                  </a>
                </div>
              </div>
            )}
          </Panel>
        ))}
        {!shown.length && <p className="p-6 text-center text-sm text-slate-500">No messages yet.</p>}
      </div>
    </>
  )
}
