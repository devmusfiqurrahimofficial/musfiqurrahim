import { useEffect, useState } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import { api } from '../api.js'
import { Button, ErrorState, Field, Input, Loading, PageHeader, Panel, TextArea, useResource, useUi } from '../ui.jsx'

const EMPTY = { name: '', role: '', location: '', email: '', bio: [], stats: [], socials: { github: '', linkedin: '' }, image: '' }

// Kept at up to 4K (3840px on the longest side) so the original stays sharp wherever it's shown.
const MAX_SIDE = 3840
const QUALITY = 0.92
const MAX_UPLOAD_MB = 10 // matches MAX_SIZE in server/src/routes/profileImage.js

// Scale the image down and re-encode it as WebP before upload. GIFs are left alone (drawing one
// to a canvas keeps only the first frame), and so is any result that isn't smaller than the original.
async function compressImage(file) {
  if (file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY))
  // Browsers without WebP encoding fall back to PNG, which can come out larger.
  if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
}

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
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (data) setForm({ ...EMPTY, ...data, socials: { ...EMPTY.socials, ...data.socials } })
  }, [data])

  if (loading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const dirty = JSON.stringify(form) !== JSON.stringify({ ...EMPTY, ...data, socials: { ...EMPTY.socials, ...data.socials } })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const setAt = (key, i, value) => setForm({ ...form, [key]: form[key].map((x, j) => (j === i ? value : x)) })
  const removeAt = (key, i) => setForm({ ...form, [key]: form[key].filter((_, j) => j !== i) })

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast('Only JPG, PNG, WEBP and GIF images are allowed.', 'error')
      return
    }
    // Photos are compressed before upload, so only the result has to fit the server's limit.
    if (file.size > 50 * 1024 * 1024) {
      toast('Image must be under 50 MB.', 'error')
      return
    }

    setUploading(true)
    try {
      const upload = await compressImage(file)
      if (upload.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Image must be under ${MAX_UPLOAD_MB} MB after compression.`)
      const formData = new FormData()
      formData.append('image', upload)
      const json = await api('/profile-image', { method: 'POST', body: formData })
      setForm({ ...form, image: json.url })
      setPreviewUrl(json.url)
      toast('Image uploaded')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

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

  const imageToShow = previewUrl || form.image

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
            <Field label="Profile image" hint="JPG, PNG, WEBP or GIF, up to 50 MB. Photos are kept at up to 4K and converted to WebP; GIFs must be under 10 MB." required={false}>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 rounded-xl border-2 border-dashed border-white/50 dark:border-white/20 bg-white/50 dark:bg-white/5 px-3 py-3 text-sm text-slate-500 dark:text-slate-400 hover:border-sky-400 transition cursor-pointer">
                  <Upload className="h-4 w-4 text-sky-500" />
                  <span>Choose image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
                {uploading && <span className="text-xs text-slate-500">Uploading…</span>}
              </div>
              {imageToShow && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={imageToShow}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full object-cover border border-white/70 dark:border-white/15"
                  />
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      setForm({ ...form, image: '' })
                      setPreviewUrl(null)
                      const input = ev.currentTarget.closest('.grid')?.querySelector('input[type="file"]')
                      if (input) input.value = ''
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
      </div>
    </form>
  )
}
