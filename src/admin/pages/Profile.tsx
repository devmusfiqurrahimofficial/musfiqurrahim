'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { ExternalLink, FileText, Plus, Trash2, Upload } from 'lucide-react'
import { CONTACT_TEXT, CONTACT_TITLE, TOOLS_TITLE } from '@/config/siteText'
import { errorDetails } from '@/features/api/apiErrors'
import { useGetProfileQuery, useUpdateProfileMutation } from '@/features/profile/profileApi'
import { uploadImage, uploadResume } from '@/features/uploads/uploadsThunks'
import { useAppDispatch } from '@/store/hooks'
import type { Profile } from '@/types/models'
import { Button, ErrorState, Field, Input, Loading, PageHeader, Panel, TextArea } from '../ui'

const EMPTY: Profile = {
  name: '',
  role: '',
  location: '',
  email: '',
  bio: [],
  stats: [],
  socials: { github: '', linkedin: '' },
  image: '',
  resumeUrl: '',
  siteTitle: '',
  contactTitle: '',
  contactText: '',
  toolsTitle: '',
}

const formOf = (p?: Partial<Profile> | null): Profile => ({
  ...EMPTY,
  ...p,
  socials: { ...EMPTY.socials, ...p?.socials },
})

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
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
  const [form, setForm] = useState<Profile>(EMPTY)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const errors = errorDetails(saveError)

  useEffect(() => {
    if (data) setForm(formOf(data))
  }, [data])

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const dirty = JSON.stringify(form) !== JSON.stringify(formOf(data))
  const set = (key: keyof Profile) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })
  const setSocial = (key: string) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, socials: { ...form.socials, [key]: e.target.value } })
  const setBio = (i: number, val: string) =>
    setForm({ ...form, bio: form.bio.map((x, j) => (j === i ? val : x)) })
  const removeBio = (i: number) =>
    setForm({ ...form, bio: form.bio.filter((_, j) => j !== i) })
  const addBio = () => setForm({ ...form, bio: [...form.bio, ''] })

  const setStat = (i: number, fieldName: 'label' | 'value', val: string) =>
    setForm({
      ...form,
      stats: form.stats.map((s, j) => (j === i ? { ...s, [fieldName]: val } : s)),
    })
  const removeStat = (i: number) =>
    setForm({ ...form, stats: form.stats.filter((_, j) => j !== i) })
  const addStat = () => setForm({ ...form, stats: [...form.stats, { label: '', value: '' }] })

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingImage(true)
    const result = await dispatch(uploadImage(file))
    setUploadingImage(false)
    if (uploadImage.fulfilled.match(result)) setForm((f) => ({ ...f, image: result.payload }))
  }

  const handleResumeChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingResume(true)
    const result = await dispatch(uploadResume(file))
    setUploadingResume(false)
    if (uploadResume.fulfilled.match(result)) setForm((f) => ({ ...f, resumeUrl: result.payload }))
  }

  const save = (e: FormEvent) => {
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
        <Section title="Media & Resume" description="Manage your avatar and downloadable resume/CV stored in MongoDB.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Profile Picture"
              hint="JPG, PNG, WEBP, or GIF. Upload a new photo or provide an image URL. Stored in MongoDB."
              error={errors.image}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  {form.image ? (
                    <img src={form.image} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-sky-500/40" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-xl font-bold text-white shadow-inner">
                      {form.name
                        ? form.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                        : '?'}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-sky-600 focus-within:ring-2 focus-within:ring-sky-500">
                      <Upload className="h-3.5 w-3.5" /> {uploadingImage ? 'Uploading…' : 'Upload photo'}
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {form.image && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm((f) => ({ ...f, image: '' }))}
                        className="text-xs text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  value={form.image || ''}
                  onChange={set('image')}
                  placeholder="https://... or /api/uploads/..."
                  className="text-xs"
                />
              </div>
            </Field>

            <Field
              label="Resume / CV"
              hint="Upload a PDF document (up to 15 MB) or paste a public resume link (e.g. Google Drive, CDN). Opens in a new tab from the About window."
              error={errors.resumeUrl}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-within:ring-2 focus-within:ring-emerald-500">
                    <Upload className="h-3.5 w-3.5" /> {uploadingResume ? 'Uploading resume…' : 'Upload PDF resume'}
                    <input type="file" accept=".pdf,application/pdf" onChange={handleResumeChange} className="hidden" />
                  </label>
                  {form.resumeUrl && (
                    <>
                      <a
                        href={form.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                      >
                        <FileText className="h-3.5 w-3.5" /> Preview <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm((f) => ({ ...f, resumeUrl: '' }))}
                        className="text-xs text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                      </Button>
                    </>
                  )}
                </div>
                <Input
                  value={form.resumeUrl || ''}
                  onChange={set('resumeUrl')}
                  placeholder="https://... or /api/uploads/..."
                  className="text-xs"
                />
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}>
              <Input value={form.name} onChange={set('name')} invalid={!!errors.name} required />
            </Field>
            <Field label="Role" error={errors.role}>
              <Input value={form.role || ''} onChange={set('role')} invalid={!!errors.role} />
            </Field>
            <Field label="Location" error={errors.location}>
              <Input value={form.location || ''} onChange={set('location')} invalid={!!errors.location} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email || ''} onChange={set('email')} invalid={!!errors.email} />
            </Field>
          </div>
        </Section>

        <Section
          title="Bio paragraphs"
          action={
            <Button variant="glass" size="sm" onClick={addBio}>
              <Plus className="h-3.5 w-3.5" /> Add paragraph
            </Button>
          }
        >
          <div className="space-y-3">
            {form.bio.map((p, i) => (
              <div key={i} className="flex gap-2">
                <TextArea
                  value={p}
                  onChange={(e) => setBio(i, e.target.value)}
                  rows={3}
                  className="flex-1"
                  placeholder={`Paragraph ${i + 1}`}
                />
                <Button variant="ghost" size="icon" aria-label="Remove paragraph" onClick={() => removeBio(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Stats"
          action={
            <Button variant="glass" size="sm" onClick={addStat}>
              <Plus className="h-3.5 w-3.5" /> Add stat
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {form.stats.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-white/40 p-2 dark:bg-white/5">
                <Input
                  value={s.label}
                  onChange={(e) => setStat(i, 'label', e.target.value)}
                  placeholder="Label"
                  className="flex-1"
                />
                <Input
                  value={s.value}
                  onChange={(e) => setStat(i, 'value', e.target.value)}
                  placeholder="Value"
                  className="w-24"
                />
                <Button variant="ghost" size="icon" aria-label="Remove stat" onClick={() => removeStat(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Socials">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="GitHub URL">
              <Input value={form.socials?.github || ''} onChange={setSocial('github')} placeholder="https://github.com/..." />
            </Field>
            <Field label="LinkedIn URL">
              <Input value={form.socials?.linkedin || ''} onChange={setSocial('linkedin')} placeholder="https://linkedin.com/in/..." />
            </Field>
          </div>
        </Section>

        <Section title="Site Text">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site title" hint="Browser tab title. Empty defaults to 'Musfiqur Rahim — Portfolio'.">
              <Input value={form.siteTitle || ''} onChange={set('siteTitle')} />
            </Field>
            <Field label="Contact title" hint={`Empty defaults to '${CONTACT_TITLE}'.`}>
              <Input value={form.contactTitle || ''} onChange={set('contactTitle')} />
            </Field>
            <Field label="Contact text" hint={`Empty defaults to '${CONTACT_TEXT}'.`}>
              <Input value={form.contactText || ''} onChange={set('contactText')} />
            </Field>
            <Field label="Tools title" hint={`Empty defaults to '${TOOLS_TITLE}'.`}>
              <Input value={form.toolsTitle || ''} onChange={set('toolsTitle')} />
            </Field>
          </div>
        </Section>
      </div>
    </form>
  )
}
