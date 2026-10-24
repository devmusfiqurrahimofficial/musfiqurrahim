import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { api } from '../api.js'
import { Button, ErrorState, Input, Loading, PageHeader, Panel, useResource, useUi } from '../ui.jsx'

function GroupEditor({ group, isFirst, isLast, onMove, onSaved, onDelete }) {
  const { toast } = useUi()
  const [form, setForm] = useState(group)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(form) !== JSON.stringify(group)

  const setItem = (i, patch) => setForm({ ...form, items: form.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const { id, ...body } = form
      const saved = await api(`/skills/${id}`, { method: 'PUT', body })
      setForm(saved)
      onSaved(saved)
      toast(`${saved.group} saved`)
    } catch (err) {
      setError(err.details ? Object.values(err.details).join('; ') : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} aria-label="Group name" className="max-w-xs !text-base font-semibold" />
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Move group up" disabled={isFirst} onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Move group down" disabled={isLast} onClick={() => onMove(1)}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Delete ${group.group}`} onClick={onDelete} className="hover:!bg-rose-500/10 hover:text-rose-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {form.items.map((item, i) => (
          <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
            <Input value={item.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder="Skill" aria-label={`Skill ${i + 1} name`} className="sm:max-w-64" />
            <input
              type="range"
              min="0"
              max="100"
              value={item.level}
              onChange={(e) => setItem(i, { level: Number(e.target.value) })}
              aria-label={`${item.name || `Skill ${i + 1}`} level`}
              className="min-w-24 flex-1 accent-sky-500"
            />
            <span className="w-10 text-right text-sm tabular-nums text-slate-500 dark:text-slate-400">{item.level}%</span>
            <Button variant="ghost" size="icon" aria-label={`Remove ${item.name || `skill ${i + 1}`}`} onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="glass" size="sm" onClick={() => setForm({ ...form, items: [...form.items, { name: '', level: 70 }] })}>
          <Plus className="h-3.5 w-3.5" /> Skill
        </Button>
        {dirty && (
          <>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setForm(group)}>
              Discard
            </Button>
            <Button size="sm" busy={busy} onClick={save}>
              Save group
            </Button>
          </>
        )}
      </div>
    </Panel>
  )
}

export default function SkillsPage() {
  const { toast, confirm } = useUi()
  const { data: groups, error, loading, reload, setData } = useResource('/skills')
  const [adding, setAdding] = useState(false)

  if (loading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const add = async () => {
    setAdding(true)
    try {
      const created = await api('/skills', { method: 'POST', body: { group: 'New group', items: [] } })
      setData((list) => [...list, created])
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setAdding(false)
    }
  }

  const move = async (index, delta) => {
    const next = [...groups]
    ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
    setData(next)
    try {
      await api('/skills/reorder', { method: 'POST', body: { ids: next.map((g) => g.id) } })
    } catch (err) {
      setData(groups)
      toast(err.message, 'error')
    }
  }

  const remove = async (group) => {
    const ok = await confirm({ title: 'Delete group?', message: `"${group.group}" and its ${group.items.length} skills will be removed.`, confirmLabel: 'Delete', danger: true })
    if (!ok) return
    try {
      await api(`/skills/${group.id}`, { method: 'DELETE' })
      setData((list) => list.filter((g) => g.id !== group.id))
      toast('Group deleted')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Skills"
        description="Groups and levels shown in the Skills window. Each group saves on its own."
        actions={
          <Button onClick={add} busy={adding}>
            <Plus className="h-4 w-4" /> New group
          </Button>
        }
      />
      <div className="space-y-4">
        {groups.map((g, i) => (
          <GroupEditor
            key={g.id}
            group={g}
            isFirst={i === 0}
            isLast={i === groups.length - 1}
            onMove={(delta) => move(i, delta)}
            onSaved={(saved) => setData((list) => list.map((x) => (x.id === saved.id ? saved : x)))}
            onDelete={() => remove(g)}
          />
        ))}
      </div>
    </>
  )
}
