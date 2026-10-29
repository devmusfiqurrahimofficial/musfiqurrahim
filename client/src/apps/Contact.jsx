import { useState } from 'react'
import { Send, Mail } from 'lucide-react'
import { CONTACT_TEXT, CONTACT_TITLE } from '../config/siteText.js'
import { selectContactStatus } from '../features/contact/contactSlice.js'
import { submitContactForm } from '../features/contact/contactThunks.js'
import { selectProfile } from '../features/content/contentSelectors.js'
import { useAppDispatch, useAppSelector } from '../store/hooks.js'
import { GithubIcon, LinkedinIcon } from '../components/BrandIcons.jsx'

const channelsFor = (profile) => [
  { label: 'Email', value: profile.email, href: `mailto:${profile.email}`, icon: Mail },
  { label: 'GitHub', value: profile.socials?.github?.replace(/^https?:\/\/(www\.)?/, ''), href: profile.socials?.github, icon: GithubIcon },
  { label: 'LinkedIn', value: profile.socials?.linkedin?.replace(/^https?:\/\/(www\.)?/, ''), href: profile.socials?.linkedin, icon: LinkedinIcon },
].filter((c) => c.value)

const field =
  'w-full rounded-xl border border-white/70 dark:border-white/15 bg-white/60 dark:bg-white/[0.06] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-3 focus:ring-sky-200 dark:focus:ring-sky-900'

const EMPTY_FORM = { name: '', email: '', message: '', website: '' }

export default function Contact() {
  const dispatch = useAppDispatch()
  const profile = useAppSelector(selectProfile)
  const status = useAppSelector(selectContactStatus)
  const channels = channelsFor(profile)
  const [form, setForm] = useState(EMPTY_FORM)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const result = await dispatch(submitContactForm(form))
    if (result.payload === 'sent') setForm(EMPTY_FORM)
  }

  return (
    <div className="scroll-thin grid h-full overflow-y-auto sm:grid-cols-[220px_1fr]">
      <aside className="border-b border-slate-900/[0.06] dark:border-white/[0.07] bg-white/30 dark:bg-black/15 p-5 sm:border-r sm:border-b-0">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{profile.contactTitle || CONTACT_TITLE}</h2>
        <p className="mt-1 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{profile.contactText || CONTACT_TEXT}</p>
        <ul className="mt-4 space-y-2">
          {channels.map(({ label, value, href, icon: Icon }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-sky-500/10">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-slate-400">{label}</span>
                  <span className="block truncate text-[13px] font-medium text-slate-700 dark:text-slate-200">{value}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <form onSubmit={submit} className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Name</span>
            <input required value={form.name} onChange={update('name')} className={field} placeholder="Jane Doe" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Email</span>
            <input required type="email" value={form.email} onChange={update('email')} className={field} placeholder="jane@company.com" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Message</span>
          <textarea required rows={6} value={form.message} onChange={update('message')} className={`${field} resize-none`} placeholder="Tell me about your project…" />
        </label>
        {/* Honeypot: hidden from people, so only bots fill it in. */}
        <input type="text" name="website" value={form.website} onChange={update('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={status.state === 'sending'} className="flex shrink-0 items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-60">
            <Send className="h-4 w-4" /> {status.state === 'sending' ? 'Sending…' : 'Send message'}
          </button>
          {status.text && (
            <span role="status" className={`text-[13px] ${status.state === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-sky-700 dark:text-sky-300'}`}>
              {status.text}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
