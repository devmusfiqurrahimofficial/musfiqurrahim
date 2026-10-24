import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../api.js'
import { Button, ErrorState, Field, Input, Loading, PageHeader, Panel, TextArea, useResource, useUi } from '../ui.jsx'

const EMPTY = { name: '', role: '', location: '', email: '', bio: [], stats: [], socials: { github: '', linkedin: '' } }

function Section({ title, description, children, action }) {
  return (
    <Panel className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Panel>
  )
}

export default function ProfilePage() {
  const { toast } = useUi()
  const { data, error, loading, reload, setData } = useResource('/profile')
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data) setForm({ ...EMPTY, ...data, socials: { ...EMPTY.socials, ...data.socials } })
  }, [data])

  if (loading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const dirty = JSON.stringify(form) !== JSON.stringify({ ...EMPTY, ...data, socials: { ...EMPTY.socials, ...data.socials } })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const setAt = (key, i, value) => setForm({ ...form, [key]: form[key].map((x, j) => (j === i ? value : x)) })
  const removeAt = (key, i) => setForm({ ...form, [key]: form[key].filter((_, j) => j !== i) })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const saved = await api('/profile', { method: 'PUT', body: { ...form, bio: form.bio.filter((p) => p.trim()) } })
      setData(saved)
      toast('Profile saved')
    } catch (err) {
      setErrors(err.details || {})
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save}>
      <PageHeader
        title="Profile"
        description="Shown in the About and Contact windows, the dock links and the terminal."
        actions={
          <>
            {dirty && (
              <Button variant="glass" onClick={() => setData({ ...data })}>
                Discard
              </Button>
            )}
            <Button type="submit" busy={busy} disabled={!dirty}>
              Save changes
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}>
              <Input value={form.name} onChange={set('name')} invalid={!!errors.name} />
            </Field>
            <Field label="Role" error={errors.role}>
              <Input value={form.role} onChange={set('role')} placeholder="Frontend Developer" />
            </Field>
            <Field label="Location" error={errors.location}>
              <Input value={form.location} onChange={set('location')} />
            </Field>
            <Field label="Contact email" error={errors.email} hint="Where the contact form sends messages.">
              <Input type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} />
            </Field>
          </div>
        </Section>

        <Section
          title="Bio"
          description="Each paragraph is shown separately."
          action={
            <Button variant="glass" size="sm" onClick={() => setForm({ ...form, bio: [...form.bio, ''] })} disabled={form.bio.length >= 10}>
              <Plus className="h-3.5 w-3.5" /> Paragraph
            </Button>
          }
        >
          <div className="space-y-3">
            {form.bio.map((p, i) => (
              <div key={i} className="flex gap-2">
                <TextArea rows={3} value={p} onChange={(e) => setAt('bio', i, e.target.value)} aria-label={`Paragraph ${i + 1}`} />
                <Button variant="ghost" size="icon" aria-label={`Remove paragraph ${i + 1}`} onClick={() => removeAt('bio', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.bio && <p className="text-xs text-rose-600 dark:text-rose-400">{errors.bio}</p>}
          </div>
        </Section>

        <Section
          title="Highlights"
          description="Up to six small stats on the About window."
          action={
            <Button variant="glass" size="sm" onClick={() => setForm({ ...form, stats: [...form.stats, { label: '', value: '' }] })} disabled={form.stats.length >= 6}>
              <Plus className="h-3.5 w-3.5" /> Stat
            </Button>
          }
        >
          <div className="space-y-2">
            {form.stats.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input className="w-28" value={s.value} placeholder="Value" aria-label={`Stat ${i + 1} value`} onChange={(e) => setAt('stats', i, { ...s, value: e.target.value })} />
                <Input value={s.label} placeholder="Label" aria-label={`Stat ${i + 1} label`} onChange={(e) => setAt('stats', i, { ...s, label: e.target.value })} />
                <Button variant="ghost" size="icon" aria-label={`Remove stat ${i + 1}`} onClick={() => removeAt('stats', i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.stats && <p className="text-xs text-rose-600 dark:text-rose-400">{errors.stats}</p>}
          </div>
        </Section>

        <Section title="Social links">
          <div className="grid gap-4 sm:grid-cols-2">
            {['github', 'linkedin'].map((key) => (
              <Field key={key} label={key === 'github' ? 'GitHub' : 'LinkedIn'}>
                <Input type="url" value={form.socials[key]} placeholder="https://" onChange={(e) => setForm({ ...form, socials: { ...form.socials, [key]: e.target.value } })} />
              </Field>
            ))}
          </div>
          {errors.socials && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{errors.socials}</p>}
        </Section>
      </div>
    </form>
  )
}
