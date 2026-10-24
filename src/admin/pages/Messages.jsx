import { useEffect, useState } from 'react'
import { Inbox, Mail, MailOpen, RefreshCw, Reply, Trash2 } from 'lucide-react'
import { api } from '../api.js'
import { Button, ErrorState, Loading, PageHeader, Panel, useResource, useUi } from '../ui.jsx'

// Fired after reading or deleting, so the sidebar's unread badge catches up.
export const MESSAGES_CHANGED = 'admin:messages-changed'
const announce = () => window.dispatchEvent(new Event(MESSAGES_CHANGED))

const when = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function MessagesPage() {
  const { toast, confirm } = useUi()
  const { data: messages, error, loading, reload, setData } = useResource('/messages')
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)

  // New messages arrive while the page is open; check every 30 seconds.
  useEffect(() => {
    const timer = setInterval(reload, 30_000)
    return () => clearInterval(timer)
  }, [reload])

  if (loading && !messages) return <Loading />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const setRead = async (message, read) => {
    setData((list) => list.map((m) => (m.id === message.id ? { ...m, read } : m)))
    try {
      await api(`/messages/${message.id}`, { method: 'PATCH', body: { read } })
      announce()
    } catch (err) {
      setData((list) => list.map((m) => (m.id === message.id ? message : m)))
      toast(err.message, 'error')
    }
  }

  const open = (message) => {
    setOpenId(openId === message.id ? null : message.id)
    if (!message.read) setRead(message, true)
  }

  const remove = async (message) => {
    const ok = await confirm({ title: 'Delete message?', message: `The message from ${message.name} will be deleted.`, confirmLabel: 'Delete', danger: true })
    if (!ok) return
    try {
      await api(`/messages/${message.id}`, { method: 'DELETE' })
      setData((list) => list.filter((m) => m.id !== message.id))
      announce()
      toast('Message deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const unread = messages.filter((m) => !m.read).length
  const shown = filter === 'unread' ? messages.filter((m) => !m.read) : messages

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
                  className={`rounded-[10px] px-3 py-1 text-xs font-medium capitalize transition ${filter === f ? 'bg-white text-slate-800 shadow-sm dark:bg-white/20 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button variant="glass" size="sm" onClick={reload} aria-label="Refresh">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      />

      {shown.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 p-10 text-center">
          <Inbox className="h-8 w-8 text-sky-500" />
          <p className="text-sm text-slate-600 dark:text-slate-300">{filter === 'unread' ? 'No unread messages.' : 'No messages yet. They appear here when someone uses the Contact window.'}</p>
        </Panel>
      ) : (
        <Panel as="ul" className="divide-y divide-slate-900/5 overflow-hidden dark:divide-white/10">
          {shown.map((m) => {
            const expanded = openId === m.id
            return (
              <li key={m.id}>
                <button onClick={() => open(m)} aria-expanded={expanded} className="flex w-full items-start gap-3 p-3 text-left transition hover:bg-white/40 sm:p-4 dark:hover:bg-white/5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.read ? 'bg-transparent' : 'bg-sky-500'}`} aria-label={m.read ? undefined : 'Unread'} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={`truncate text-sm text-slate-800 dark:text-slate-100 ${m.read ? 'font-medium' : 'font-semibold'}`}>{m.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">{when(m.createdAt)}</span>
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{m.email}</span>
                    {!expanded && <span className="mt-1 block truncate text-sm text-slate-600 dark:text-slate-300">{m.message}</span>}
                  </span>
                </button>
                {expanded && (
                  <div className="px-3 pb-4 pl-8 sm:px-4 sm:pl-9">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">{m.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message on my portfolio')}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
                      >
                        <Reply className="h-3.5 w-3.5" /> Reply
                      </a>
                      <Button variant="glass" size="sm" onClick={() => setRead(m, !m.read)}>
                        {m.read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />} Mark as {m.read ? 'unread' : 'read'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(m)} className="hover:!bg-rose-500/10 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </Panel>
      )}
    </>
  )
}
