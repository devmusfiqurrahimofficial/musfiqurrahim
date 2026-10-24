import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { previewOf } from '../../data.js'
import { api } from '../api.js'
import { GRADIENTS } from '../gradients.js'
import { Button, ErrorState, Field, Input, Loading, Modal, PageHeader, Panel, TagInput, TextArea, inputClass, useResource, useUi } from '../ui.jsx'

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

function ProjectForm({ initial, categories, onClose, onSaved }) {
  const { toast } = useUi()
  const [form, setForm] = useState({ ...BLANK, ...initial, tags: initial.tags ?? [] })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    const { id, ...body } = form
    try {
      const saved = await api(id ? `/projects/${id}` : '/projects', { method: id ? 'PUT' : 'POST', body })
      onSaved(saved, !id)
    } catch (err) {
      setErrors(err.details || {})
      if (!err.details) toast(err.message, 'error')
      setBusy(false)
    }
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
          hint={form.name ? `Leave empty to use ${previewOf(form)}` : 'A URL or a path under /public.'}
          className="sm:col-span-2"
        >
          <Input value={form.image} onChange={set('image')} placeholder="https://… or /projects/my-shot.webp" invalid={!!errors.image} />
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
  const { toast, confirm } = useUi()
  const { data: projects, error, loading, reload, setData } = useResource('/projects')
  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  if (loading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const categories = [...new Set(projects.map((p) => p.category))].sort()
  const q = query.trim().toLowerCase()
  const filtered = projects.filter(
    (p) => (!category || p.category === category) && (!q || [p.name, p.description, ...(p.tags ?? [])].some((s) => s?.toLowerCase().includes(q)))
  )
  // Moving rows only makes sense when the whole list is visible.
  const canReorder = !q && !category

  const move = async (index, delta) => {
    const next = [...projects]
    ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
    setData(next)
    try {
      await api('/projects/reorder', { method: 'POST', body: { ids: next.map((p) => p.id) } })
    } catch (err) {
      setData(projects)
      toast(err.message, 'error')
    }
  }

  const remove = async (project) => {
    const ok = await confirm({ title: 'Delete project?', message: `"${project.name}" will be removed from your portfolio. This can't be undone.`, confirmLabel: 'Delete', danger: true })
    if (!ok) return
    try {
      await api(`/projects/${project.id}`, { method: 'DELETE' })
      setData((list) => list.filter((p) => p.id !== project.id))
      toast('Project deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const onSaved = (saved, created) => {
    setData((list) => (created ? [...list, saved] : list.map((p) => (p.id === saved.id ? saved : p))))
    setEditing(null)
    toast(created ? 'Project created' : 'Project saved')
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${projects.length} projects, shown on the site in this order.`}
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

      <Panel className="divide-y divide-slate-900/5 overflow-hidden dark:divide-white/10">
        {filtered.length === 0 && <p className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">No projects match.</p>}
        {filtered.map((p) => {
          const index = projects.indexOf(p)
          return (
            <div key={p.id} className="flex items-center gap-4 p-3 transition hover:bg-white/30 sm:p-4 dark:hover:bg-white/5">
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
      </Panel>

      {editing && <ProjectForm initial={editing} categories={categories} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </>
  )
}
