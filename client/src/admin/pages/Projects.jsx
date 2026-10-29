import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, ExternalLink, GripVertical, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
import { previewOf } from '../../data.js'
import { moved } from '../../features/api/collectionEndpoints.js'
import { errorDetails } from '../../features/api/apiErrors.js'
import { confirm } from '../../features/dialog/dialogThunks.js'
import { useDeleteProjectMutation, useGetProjectsQuery, useReorderProjectsMutation, useSaveProjectMutation } from '../../features/projects/projectsApi.js'
import { selectAdminCategories, selectAdminProjects, selectFilteredProjects } from '../../features/projects/projectsSelectors.js'
import { IMAGE_TYPES } from '../../features/uploads/compressImage.js'
import { uploadImage } from '../../features/uploads/uploadsThunks.js'
import { useAppDispatch, useAppSelector } from '../../store/hooks.js'
import { GRADIENTS } from '../gradients.js'
import { useDragSort } from '../useDragSort.js'
import { Button, ErrorState, Field, Input, Loading, Modal, PageHeader, Panel, TagInput, TextArea, inputClass } from '../ui.jsx'

const BLANK = { name: '', category: '', description: '', tags: [], color: GRADIENTS[0], demo: '', code: '', image: '' }

function Thumb({ project, className = '' }) {
  const [failed, setFailed] = useState(false)
  const src = project.image || (project.name && previewOf(project))
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${project.color} ${className}`}>
      {src && !failed && <img src={src} alt="" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover object-top" />}
    </div>
  )
}

function ProjectForm({ initial, onClose }) {
  const dispatch = useAppDispatch()
  const categories = useAppSelector(selectAdminCategories)
  const [saveProject, { isLoading: busy, error }] = useSaveProjectMutation()
  const [form, setForm] = useState({ ...BLANK, ...initial, tags: initial.tags ?? [] })
  const [uploading, setUploading] = useState(false)
  const errors = errorDetails(error)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const upload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const result = await dispatch(uploadImage(file))
    setUploading(false)
    if (uploadImage.fulfilled.match(result)) setForm((f) => ({ ...f, image: result.payload }))
  }

  const save = async (e) => {
    e.preventDefault()
    const result = await saveProject(form)
    if (!result.error) onClose()
  }

  return (
    <Modal
      wide
      title={form.id ? `Edit ${initial.name}` : 'New project'}
      onClose={onClose}
      footer={
        <>
          <Button variant="glass" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" busy={busy}>
            {form.id ? 'Save' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name}>
          <Input value={form.name} onChange={set('name')} invalid={!!errors.name} required />
        </Field>
        <Field label="Category" error={errors.category}>
          <Input value={form.category} onChange={set('category')} list="project-categories" invalid={!!errors.category} required />
          <datalist id="project-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Description" error={errors.description} className="sm:col-span-2">
          <TextArea rows={3} value={form.description} onChange={set('description')} invalid={!!errors.description} />
        </Field>
        <Field label="Tags" error={errors.tags} hint="Press Enter or comma after each tag." className="sm:col-span-2">
          <TagInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} invalid={!!errors.tags} />
        </Field>
        <Field label="Live URL" error={errors.demo}>
          <Input type="url" value={form.demo} onChange={set('demo')} placeholder="https://" invalid={!!errors.demo} />
        </Field>
        <Field label="Source URL" error={errors.code}>
          <Input type="url" value={form.code} onChange={set('code')} placeholder="https://github.com/…" invalid={!!errors.code} />
        </Field>
        <Field
          label="Preview image"
          error={errors.image}
          hint={`Upload a screenshot, or paste a URL or a path under /public.${form.name ? ` Empty uses ${previewOf(form)}.` : ''}`}
          className="sm:col-span-2"
        >
          <div className="flex items-center gap-2">
            <Thumb project={form} className="hidden h-10 w-16 shrink-0 sm:block" key={form.image} />
            <Input value={form.image} onChange={set('image')} placeholder="https://… or /projects/my-shot.webp" invalid={!!errors.image} />
            <label className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-white/60 bg-white/50 px-3 py-2 text-sm text-slate-600 transition hover:border-sky-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
              <Upload className="h-4 w-4 text-sky-500" />
              {uploading ? 'Uploading…' : 'Upload'}
              <input type="file" accept={IMAGE_TYPES.join(',')} onChange={upload} className="sr-only" />
            </label>
          </div>
        </Field>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Card colour</legend>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Shown behind the preview, and on its own if there's no image.</p>
          <div className="flex flex-wrap gap-2">
            {GRADIENTS.map((g) => (
              <button
                key={g}
                type="button"
                title={g}
                aria-label={g}
                aria-pressed={form.color === g}
                onClick={() => setForm({ ...form, color: g })}
                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${g} text-white ring-offset-2 ring-offset-transparent transition hover:scale-105 ${
                  form.color === g ? 'ring-2 ring-sky-500' : 'ring-1 ring-white/50'
                }`}
              >
                {form.color === g && <Check className="h-4 w-4 drop-shadow" />}
              </button>
            ))}
          </div>
          {errors.color && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.color}</p>}
        </fieldset>
      </form>
    </Modal>
  )
}

export default function ProjectsPage() {
  const dispatch = useAppDispatch()
  const { error, isLoading, refetch } = useGetProjectsQuery()
  const [deleteProject] = useDeleteProjectMutation()
  const [reorderProjects] = useReorderProjectsMutation()
  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const projects = useAppSelector(selectAdminProjects)
  const categories = useAppSelector(selectAdminCategories)
  const filtered = useAppSelector((state) => selectFilteredProjects(state, query, category))
  const { draggingId, slot, rowProps, handleProps } = useDragSort(
    projects.map((p) => p.id),
    reorderProjects
  )

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  // Moving rows only makes sense when the whole list is visible.
  const canReorder = !query.trim() && !category
  const move = (index, delta) => reorderProjects(moved(projects.map((p) => p.id), index, delta))

  const remove = async (project) => {
    const ok = await dispatch(confirm({ title: 'Delete project?', message: `"${project.name}" will be removed from your portfolio. This can't be undone.`, confirmLabel: 'Delete', danger: true }))
    if (ok) deleteProject(project.id)
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${projects.length} projects, shown on the site in this order. Drag a row by its handle to move it.`}
        actions={
          <Button onClick={() => setEditing(BLANK)}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      <Panel className="mb-4 flex flex-wrap gap-2 p-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, description or tag" className="pl-9" aria-label="Search projects" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass.replace('w-full', 'w-full sm:w-56')} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Panel>

      <Panel className="overflow-hidden">
        {slot && <div aria-hidden className="pointer-events-none absolute inset-x-2 rounded-2xl border-2 border-dashed border-sky-400/70 bg-sky-400/10" style={slot} />}
        <div className="divide-y divide-slate-900/5 dark:divide-white/10">
          {filtered.length === 0 && <p className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">No projects match.</p>}
          {filtered.map((p) => {
            const index = projects.indexOf(p)
            // no transition on the dragged row (it tracks the pointer) or after the drop (rows jump to their new slots)
            const state = !draggingId
              ? 'transition-colors hover:bg-white/30 dark:hover:bg-white/5'
              : p.id === draggingId
                ? 'relative z-10 rounded-2xl bg-white/95 shadow-xl ring-2 ring-sky-400 dark:bg-slate-800/95'
                : 'transition-transform duration-200'
            return (
              <div key={p.id} {...rowProps(p.id)} className={`flex items-center gap-4 p-3 sm:p-4 ${state}`}>
                {canReorder && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Reorder ${p.name} (drag, or use the arrow keys)`}
                    title="Drag to reorder"
                    {...handleProps(p.id)}
                    className={`-mx-1.5 touch-none text-slate-400 ${p.id === draggingId ? 'cursor-grabbing' : 'cursor-grab'}`}
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                )}
                <Thumb project={p} className="hidden h-14 w-22 shrink-0 sm:block" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">{p.name}</h3>
                    <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">{p.category}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{p.description || (p.tags ?? []).join(' · ')}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noreferrer" aria-label={`Open ${p.name}`} className="hidden h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-white/50 sm:flex dark:text-slate-400 dark:hover:bg-white/10">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {canReorder && (
                    <>
                      <Button variant="ghost" size="icon" aria-label={`Move ${p.name} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Move ${p.name} down`} disabled={index === projects.length - 1} onClick={() => move(index, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${p.name}`} onClick={() => remove(p)} className="hover:!bg-rose-500/10 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      {editing && <ProjectForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
