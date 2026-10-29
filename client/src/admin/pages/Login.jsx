import { useState } from 'react'
import { AlertCircle, LockKeyhole, MailCheck } from 'lucide-react'
import { selectInfo, selectNotice, selectPending } from '../../features/auth/authSelectors.js'
import { requestPasswordReset, signInWithPassword } from '../../features/auth/authThunks.js'
import { auth, missingConfig } from '../../features/auth/firebase.js'
import { useAppDispatch, useAppSelector } from '../../store/hooks.js'
import { Button, Field, Input, Panel } from '../ui.jsx'

// This only gets a Firebase session; if the account isn't on the API's allowlist it's signed straight back out.
export default function Login() {
  const dispatch = useAppDispatch()
  const error = useAppSelector(selectNotice)
  const info = useAppSelector(selectInfo)
  const busy = useAppSelector(selectPending)
  const [form, setForm] = useState({ email: '', password: '' })

  const signIn = (e) => {
    e.preventDefault()
    dispatch(signInWithPassword(form))
  }
  const resetPassword = () => dispatch(requestPasswordReset(form.email))

  if (!auth) {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <Panel className="w-full max-w-sm p-8 text-sm text-slate-600 dark:text-slate-300">
          <h1 className="mb-2 text-lg font-bold text-slate-800 dark:text-slate-100">Firebase isn't configured</h1>
          <p>Add these to the project's <code>.env</code> (see <code>.env.example</code>) and restart the dev server:</p>
          <ul className="mt-3 space-y-1 font-mono text-xs">
            {missingConfig.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Panel as="form" onSubmit={signIn} className="animate-window-open w-full max-w-sm p-8">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_24px_-10px_rgba(2,132,199,0.9)]">
          <LockKeyhole className="h-6 w-6" />
        </span>
        <h1 className="text-center text-xl font-bold text-slate-800 dark:text-slate-100">Portfolio Admin</h1>
        <p className="mt-1 mb-6 text-center text-sm text-slate-500 dark:text-slate-400">Sign in to edit your site.</p>

        {error && (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}
        {info && (
          <p role="status" className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0" /> {info}
          </p>
        )}

        <div className="space-y-4">
          <Field label="Email">
            <Input type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
        </div>
        <Button type="submit" busy={busy === 'password'} disabled={!!busy} className="mt-6 w-full">
          Sign in
        </Button>
        <button
          type="button"
          onClick={resetPassword}
          disabled={!!busy}
          className="mt-3 w-full text-center text-xs text-slate-500 hover:text-sky-600 disabled:opacity-50 dark:text-slate-400 dark:hover:text-sky-300"
        >
          Forgot password?
        </button>
      </Panel>
    </div>
  )
}
