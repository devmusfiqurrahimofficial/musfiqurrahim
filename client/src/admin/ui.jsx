import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { errorMessage } from '../features/api/apiErrors.js'
import { selectDialog, confirmSettled } from '../features/dialog/dialogSlice.js'
import { selectToasts } from '../features/notifications/notificationsSlice.js'
import { useAppDispatch, useAppSelector } from '../store/hooks.js'

export function Panel({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`glass-panel relative rounded-3xl ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

const buttonVariants = {
  primary:
    'bg-sky-500 text-white hover:bg-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_-8px_rgba(2,132,199,0.8)]',
  glass:
    'bg-white/55 text-slate-700 ring-1 ring-white/70 hover:bg-white/80 dark:bg-white/10 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-white/15',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]',
  ghost: 'text-slate-600 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-white/10',
}

export function Button({ variant = 'primary', size = 'md', busy = false, className = '', children, disabled, ...props }) {
  const sizes = { md: 'px-4 py-2 text-sm', sm: 'px-2.5 py-1.5 text-xs', icon: 'h-8 w-8' }
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:pointer-events-none disabled:opacity-50 ${sizes[size]} ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export const inputClass =
  'w-full rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white/80 focus:ring-3 focus:ring-sky-300/40 aria-invalid:border-rose-400 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:focus:bg-white/10 dark:focus:ring-sky-500/25'

export function Field({ label, error, hint, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      )}
    </label>
  )
}

export const Input = ({ invalid, className = '', ...props }) => <input aria-invalid={invalid || undefined} className={`${inputClass} ${className}`} {...props} />

export const TextArea = ({ invalid, className = '', ...props }) => (
  <textarea aria-invalid={invalid || undefined} className={`${inputClass} resize-y ${className}`} {...props} />
)

// Chips for short lists (tags, tools). Enter or comma adds, Backspace on empty removes the last one.
export function TagInput({ value, onChange, placeholder = 'Type and press Enter', invalid }) {
  const [draft, setDraft] = useState('')

  const add = (raw) => {
    const next = [...value]
    for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!next.some((v) => v.toLowerCase() === part.toLowerCase())) next.push(part)
    }
    if (next.length !== value.length) onChange(next)
    setDraft('')
  }

  return (
    <div
      aria-invalid={invalid || undefined}
      className={`${inputClass} flex min-h-[42px] flex-wrap items-center gap-1.5 !py-1.5 focus-within:border-sky-400 focus-within:ring-3 focus-within:ring-sky-300/40`}
    >
      {value.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-lg bg-sky-500/15 py-0.5 pr-1 pl-2 text-xs font-medium text-sky-800 dark:text-sky-200">
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="rounded p-0.5 hover:bg-sky-500/20"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add(draft)
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? '' : placeholder}
        className="min-w-24 flex-1 bg-transparent py-0.5 outline-none placeholder:text-slate-400"
      />
    </div>
  )
}

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // Focus once on open; onClose is usually an inline function, so it's read through a ref.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    ref.current?.querySelector('[data-modal-body] :is(input, textarea, select)')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Panel
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-window-open flex max-h-[92vh] w-full flex-col rounded-b-none sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
      >
        <header className="flex items-center justify-between border-b border-slate-900/5 px-6 py-4 dark:border-white/10">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div data-modal-body className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-900/5 px-6 py-4 dark:border-white/10">{footer}</footer>}
      </Panel>
    </div>
  )
}

// The pane's toolbar: sticks to the top of the scrolling pane, like the title bar of a System Settings pane.
export function PageHeader({ title, description, actions }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-sky-900/10 bg-white/45 px-4 py-3.5 backdrop-blur-xl sm:-mx-6 sm:px-6 dark:border-white/10 dark:bg-slate-900/40">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold tracking-tight text-slate-800 dark:text-slate-100">{title}</h1>
        {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Loading({ label = 'Loading…' }) {
  return (
    <Panel className="mt-5 flex items-center justify-center gap-3 p-10 text-sm text-slate-500 dark:text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin text-sky-500" /> {label}
    </Panel>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <Panel className="mt-5 flex flex-col items-center gap-3 p-10 text-center">
      <AlertCircle className="h-6 w-6 text-rose-500" />
      <p className="text-sm text-slate-600 dark:text-slate-300">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="glass" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Panel>
  )
}

export function Toaster() {
  const toasts = useAppSelector(selectToasts)
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <Panel key={t.id} className="animate-menu flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-slate-700 dark:text-slate-100">
          {t.type === 'error' ? <AlertCircle className="h-4 w-4 text-rose-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {t.message}
        </Panel>
      ))}
    </div>
  )
}

// see confirm() in features/dialog/dialogThunks.js
export function ConfirmDialog() {
  const dispatch = useAppDispatch()
  const dialog = useAppSelector(selectDialog)
  if (!dialog) return null
  const settle = (ok) => dispatch(confirmSettled({ id: dialog.id, ok }))
  return (
    <Modal
      title={dialog.title}
      onClose={() => settle(false)}
      footer={
        <>
          <Button variant="glass" onClick={() => settle(false)}>
            Cancel
          </Button>
          <Button variant={dialog.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
            {dialog.confirmLabel || 'Confirm'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">{dialog.message}</p>
    </Modal>
  )
}
