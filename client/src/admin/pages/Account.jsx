import { useState } from 'react'
import { Copy } from 'lucide-react'
import { selectUser } from '../../features/auth/authSelectors.js'
import { copyUid, sendPasswordReset } from '../../features/auth/authThunks.js'
import { useAppDispatch, useAppSelector } from '../../store/hooks.js'
import { Button, PageHeader, Panel } from '../ui.jsx'

const PROVIDERS = { 'google.com': 'Google', password: 'Email and password' }

export default function AccountPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)
  const [busy, setBusy] = useState(false)

  const sendReset = async () => {
    setBusy(true)
    await dispatch(sendPasswordReset(user.email))
    setBusy(false)
  }

  const rows = [
    ['Name', user.name],
    ['Email', user.email],
    ['Signed in with', PROVIDERS[user.provider] || user.provider],
  ].filter(([, value]) => value)

  return (
    <>
      <PageHeader title="Account" description="Sign-in is handled by Firebase. Who may edit is set on the server (ADMIN_EMAILS / ADMIN_UIDS)." />
      <Panel className="max-w-xl p-6">
        <div className="mb-5 flex items-center gap-4">
          {user.picture && <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/60" />}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-800 dark:text-slate-100">{user.name || user.email}</p>
            {user.name && <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>}
          </div>
        </div>

        <dl className="divide-y divide-slate-900/5 text-sm dark:divide-white/10">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="truncate text-right font-medium text-slate-700 dark:text-slate-200">{value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-slate-500 dark:text-slate-400">Firebase UID</dt>
            <dd className="flex min-w-0 items-center gap-1">
              <code className="truncate text-xs text-slate-700 dark:text-slate-200">{user.uid}</code>
              <Button variant="ghost" size="icon" aria-label="Copy UID" onClick={() => dispatch(copyUid(user.uid))}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Putting this UID in <code>ADMIN_UIDS</code> pins admin access to this exact account, even if its email changes.
        </p>

        {user.provider === 'password' && (
          <div className="mt-6 border-t border-slate-900/5 pt-5 dark:border-white/10">
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Firebase emails you a link to set a new password.</p>
            <Button variant="glass" busy={busy} onClick={sendReset}>
              Send password reset email
            </Button>
          </div>
        )}
      </Panel>
    </>
  )
}
