import { useState } from 'react'
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { AlertCircle, LockKeyhole, MailCheck } from 'lucide-react'
import { auth, authErrorMessage, missingConfig } from '../firebase.js'
import { Button, Field, Input, Panel } from '../ui.jsx'

function GoogleLogo(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.4 3.62v3h3.88c2.27-2.1 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  )
}

// Signing in here only gets a Firebase session. AdminApp then asks the API whether that
// account is on the allowlist, and signs it straight back out if not.
export default function Login({ notice }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(notice)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(null)

  const attempt = async (kind, action) => {
    setBusy(kind)
    setError(null)
    setInfo(null)
    try {
      await action()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const signInWithPassword = (e) => {
    e.preventDefault()
    attempt('password', () => signInWithEmailAndPassword(auth, form.email.trim(), form.password))
  }

  const signInWithGoogle = () => attempt('google', () => signInWithPopup(auth, new GoogleAuthProvider()))

  const resetPassword = () =>
    attempt('reset', async () => {
      if (!form.email.trim()) throw Object.assign(new Error('Missing email'), { code: 'auth/missing-email' })
      await sendPasswordResetEmail(auth, form.email.trim())
      setInfo(`If ${form.email.trim()} has an account, a reset link is on its way.`)
    })

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
      <Panel as="form" onSubmit={signInWithPassword} className="animate-window-open w-full max-w-sm p-8">
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

        <Button variant="glass" className="w-full" onClick={signInWithGoogle} busy={busy === 'google'} disabled={!!busy}>
          {busy !== 'google' && <GoogleLogo className="h-4 w-4" />} Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-900/10 dark:bg-white/10" /> or with email <span className="h-px flex-1 bg-slate-900/10 dark:bg-white/10" />
        </div>

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
