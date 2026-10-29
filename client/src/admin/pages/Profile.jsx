import { useEffect, useState } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import { CONTACT_TEXT, CONTACT_TITLE, TOOLS_TITLE } from '../../config/siteText.js'
import { errorDetails } from '../../features/api/apiErrors.js'
import { useGetProfileQuery, useUpdateProfileMutation } from '../../features/profile/profileApi.js'
import { IMAGE_TYPES } from '../../features/uploads/compressImage.js'
import { uploadImage } from '../../features/uploads/uploadsThunks.js'
import { useAppDispatch } from '../../store/hooks.js'
import { Button, ErrorState, Field, Input, Loading, PageHeader, Panel, TextArea } from '../ui.jsx'

const EMPTY = {
  name: '',
  role: '',
  location: '',
  email: '',
  bio: [],
  stats: [],
  socials: { github: '', linkedin: '' },
  image: '',
  siteTitle: '',
  contactTitle: '',
  contactText: '',
  toolsTitle: '',
}
// The saved profile as a complete form value (older documents lack some fields).
const formOf = (profile) => ({ ...EMPTY, ...profile, socials: { ...EMPTY.socials, ...profile.socials } })

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
  const dispatch = useAppDispatch()
  const { data, error, isLoading, refetch } = useGetProfileQuery()
  const [updateProfile, { isLoading: busy, error: saveError }] = useUpdateProfileMutation()
  const [form, setForm] = useState(EMPTY)
  const [uploading, setUploading] = useState(false)
  const errors = errorDetails(saveError)

  useEffect(() => {
    if (data) setForm(formOf(data))
  }, [data])

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const dirty = JSON.stringify(form) !== JSON.stringify(formOf(data))
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const setAt = (key, i, value) => setForm({ ...form, [key]: form[key].map((x, j) => (j === i ? value : x)) })
  const removeAt = (key, i) => setForm({ ...form, [key]: form[key].filter((_, j) => j !== i) })

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const result = await dispatch(uploadImage(file))
    setUploading(false)
    if (uploadImage.fulfilled.match(result)) setForm((f) => ({ ...f, image: result.payload }))
  }

  const save = (e) => {
    e.preventDefault()
    updateProfile({ ...form, bio: form.bio.filter((p) => p.trim()) })
  }

  return (
    <form onSubmit={save}>
      <PageHeader
        title="Profile"
        description="Shown in the About and Contact windows, the dock links and the terminal."
        actions={
          <>
            {dirty && (
              <Button variant="glass" onClick={() => setForm(formOf(data))}>
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
            <Field label="Profile image" hint="JPG, PNG, WEBP or GIF, up to 50 MB. Photos are kept at up to 4K and converted to WebP; GIFs must be under 10 MB." required={false}>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 rounded-xl border-2 border-dashed border-white/50 dark:border-white/20 bg-white/50 dark:bg-white/5 px-3 py-3 text-sm text-slate-500 dark:text-slate-400 hover:border-sky-400 transition cursor-pointer">
                  <Upload className="h-4 w-4 text-sky-500" />
                  <span>Choose image</span>
                  <input
                    type="file"
                    accept={IMAGE_TYPES.join(',')}
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
                {uploading && <span className="text-xs text-slate-500">Uploading…</span>}
              </div>
              {form.image && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={form.image}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full object-cover border border-white/70 dark:border-white/15"
                  />
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      setForm({ ...form, image: '' })
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </Field>
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

        <Section title="Website text" description="Headings and the browser tab title. Leave a field empty to use the text shown in grey.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Browser tab title" error={errors.siteTitle}>
              <Input value={form.siteTitle} onChange={set('siteTitle')} placeholder={`${form.name || 'Your name'} — Portfolio`} invalid={!!errors.siteTitle} />
            </Field>
            <Field label="Skills: tools heading" error={errors.toolsTitle}>
              <Input value={form.toolsTitle} onChange={set('toolsTitle')} placeholder={TOOLS_TITLE} invalid={!!errors.toolsTitle} />
            </Field>
            <Field label="Contact: heading" error={errors.contactTitle}>
              <Input value={form.contactTitle} onChange={set('contactTitle')} placeholder={CONTACT_TITLE} invalid={!!errors.contactTitle} />
            </Field>
            <Field label="Contact: intro" error={errors.contactText} className="sm:col-span-2">
              <TextArea rows={2} value={form.contactText} onChange={set('contactText')} placeholder={CONTACT_TEXT} invalid={!!errors.contactText} />
            </Field>
          </div>
        </Section>
      </div>
    </form>
  )
}
