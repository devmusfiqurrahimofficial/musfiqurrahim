'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, GripVertical, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
import { previewOf } from '@/data'
import { errorDetails } from '@/features/api/apiErrors'
import { moved } from '@/features/api/collectionEndpoints'
import { confirm } from '@/features/dialog/dialogThunks'
import {
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useReorderProjectsMutation,
  useSaveProjectMutation,
} from '@/features/projects/projectsApi'
import {
  selectAdminCategories,
  selectAdminProjects,
  selectFilteredProjects,
} from '@/features/projects/projectsSelectors'
import { uploadImage } from '@/features/uploads/uploadsThunks'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { Project } from '@/types/models'
import { GRADIENTS } from '../gradients'
import { useDragSort } from '../useDragSort'
import { Button, ErrorState, Field, Input, Loading, Modal, PageHeader, Panel, TagInput, TextArea } from '../ui'

const BLANK: Project = {
  name: '',
  category: '',
  description: '',
  tags: [],
  color: GRADIENTS[0],
  demo: '',
  code: '',
  image: '',
}

function Thumb({ project, className = '' }: { project: Project; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = project.image || (project.name && previewOf(project))
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${project.color} ${className}`}>
      {src && !failed && (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      )}
    </div>
  )
}

function ProjectForm({ initial, onClose }: { initial: Partial<Project>; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const categories = useAppSelector(selectAdminCategories)
  const [saveProject, { isLoading: busy, error }] = useSaveProjectMutation()
  const [form, setForm] = useState<Project>({ ...BLANK, ...initial, tags: initial.tags ?? [] })
  const [uploading, setUploading] = useState(false)
  const errors = errorDetails(error)
  const set = (key: keyof Project) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const result = await dispatch(uploadImage(file))
    setUploading(false)
    if (uploadImage.fulfilled.match(result)) setForm((f) => ({ ...f, image: result.payload }))
  }

  const save = async (e: FormEvent) => {
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
          <Input
            value={form.category}
            onChange={set('category')}
            list="project-categories"
            invalid={!!errors.category}
            required
          />
          <datalist id="project-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <TextArea value={form.description || ''} onChange={set('description')} rows={3} />
        </Field>
        <Field label="Tags" className="sm:col-span-2">
          <TagInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
        </Field>
        <Field label="Gradient Background">
          <select
            value={form.color}
            onChange={set('color')}
            className="w-full rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-sm text-slate-800 outline-none dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
          >
            {GRADIENTS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Custom Preview Image">
          <div className="flex items-center gap-3">
            {form.image && <Thumb project={form} className="h-9 w-14 shrink-0" />}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/55 px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-white/70 hover:bg-white/80 dark:bg-white/10 dark:text-slate-100 dark:ring-white/10">
              <Upload className="h-3.5 w-3.5" /> {uploading ? 'Uploading…' : 'Upload image'}
              <input type="file" accept="image/*" onChange={upload} className="hidden" />
            </label>
            {form.image && (
              <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, image: '' })}>
                Remove
              </Button>
            )}
          </div>
        </Field>
        <Field label="Live demo URL">
          <Input type="url" value={form.demo || ''} onChange={set('demo')} placeholder="https://..." />
        </Field>
        <Field label="Code repository URL">
          <Input type="url" value={form.code || ''} onChange={set('code')} placeholder="https://github.com/..." />
        </Field>
      </form>
    </Modal>
  )
}

export default function ProjectsPage() {
  const dispatch = useAppDispatch()
  const { isLoading, error, refetch } = useGetProjectsQuery()
  const [deleteProject] = useDeleteProjectMutation()
  const [reorderProjects] = useReorderProjectsMutation()
  const [editing, setEditing] = useState<Partial<Project> | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  const allProjects = useAppSelector(selectAdminProjects)
  const categories = useAppSelector(selectAdminCategories)
  const filtered = useAppSelector((state) => selectFilteredProjects(state, query, category))

  const ids = allProjects.map((p: Project) => p.id!)
  const { draggingId, slot, rowProps, handleProps } = useDragSort(ids, (newIds) => reorderProjects(newIds))

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const remove = async (p: Project) => {
    const ok = await dispatch(
      confirm({
        title: `Delete ${p.name}?`,
        message: 'This will remove the project from the public portfolio.',
        confirmLabel: 'Delete',
        danger: true,
      })
    )
    if (ok && p.id) deleteProject(p.id)
  }

  const move = (index: number, delta: number) => {
    reorderProjects(moved(ids, index, delta))
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description="Drag rows to reorder them on the live site."
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-sm text-slate-800 outline-none dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="relative space-y-2">
        {slot && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 rounded-2xl border-2 border-dashed border-sky-400/50 bg-sky-500/10 transition-all duration-150"
            style={{ top: slot.top, height: slot.height }}
          />
        )}
        {filtered.map((p, i) => {
          const isDragging = draggingId === p.id
          return (
            <Panel
              key={p.id}
              {...rowProps(p.id!)}
              className={`flex items-center gap-3 p-3 transition hover:bg-white/80 dark:hover:bg-white/[0.08] ${
                isDragging ? 'z-30 opacity-90 shadow-2xl ring-2 ring-sky-400' : ''
              }`}
            >
              <button
                type="button"
                aria-label={`Drag ${p.name}`}
                {...handleProps(p.id!)}
                className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing dark:hover:text-slate-200"
              >
                <GripVertical className="h-5 w-5" />
              </button>
              <Thumb project={p} className="h-10 w-16 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {p.category} · {(p.tags ?? []).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {p.demo && (
                  <a
                    href={p.demo}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
                    aria-label={`Open ${p.name} live`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={i === allProjects.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(p)}
                  aria-label={`Delete ${p.name}`}
                  className="hover:!bg-rose-500/10 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Panel>
          )
        })}
      </div>

      {editing && <ProjectForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
