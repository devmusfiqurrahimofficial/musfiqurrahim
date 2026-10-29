import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, SquareTerminal, Trash2 } from 'lucide-react'
import { errorDetails } from '../../features/api/apiErrors.js'
import { moved } from '../../features/api/collectionEndpoints.js'
import {
  useDeleteCommandMutation,
  useGetCommandsQuery,
  useReorderCommandsMutation,
  useSaveCommandMutation,
} from '../../features/commands/commandsApi.js'
import { confirm } from '../../features/dialog/dialogThunks.js'
import { useAppDispatch } from '../../store/hooks.js'
import { Button, ErrorState, Field, Input, Loading, Modal, PageHeader, Panel, TextArea } from '../ui.jsx'

const BLANK = { name: '', description: '', output: '' }

// What the visitor will see in the Terminal window.
function Preview({ command }) {
  return (
    <div className="rounded-xl bg-[#060e1a]/90 p-3 font-mono text-[12px] leading-relaxed text-sky-100 shadow-inner">
      <div>
        <span className="text-sky-400">guest@portfolio ~ %</span> {command.name || 'your-command'}
      </div>
      <div className="whitespace-pre-wrap break-words">{command.output || ' '}</div>
    </div>
  )
}

function CommandForm({ initial, onClose }) {
  const [saveCommand, { isLoading: busy, error }] = useSaveCommandMutation()
  const [form, setForm] = useState({ ...BLANK, ...initial })
  const errors = errorDetails(error)
  const set = (key) => (e) => setForm({ ...form, [key]: key === 'name' ? e.target.value.toLowerCase() : e.target.value })

  const save = async (e) => {
    e.preventDefault()
    const result = await saveCommand(form)
    if (!result.error) onClose()
  }

  return (
    <Modal
      wide
      title={form.id ? `Edit ${initial.name}` : 'New command'}
      onClose={onClose}
      footer={
        <>
          <Button variant="glass" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="command-form" busy={busy}>
            {form.id ? 'Save' : 'Add command'}
          </Button>
        </>
      }
    >
      <form id="command-form" onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Command" error={errors.name} hint="What visitors type, e.g. hire-me">
            <Input value={form.name} onChange={set('name')} invalid={!!errors.name} required maxLength={24} className="font-mono" />
          </Field>
          <Field label="Description" error={errors.description} hint={'Shown next to it in "help".'}>
            <Input value={form.description} onChange={set('description')} invalid={!!errors.description} maxLength={100} />
          </Field>
        </div>
        <Field label="Output" error={errors.output} hint="Printed as-is; each line on its own line.">
          <TextArea rows={6} value={form.output} onChange={set('output')} invalid={!!errors.output} required className="font-mono !text-[13px]" />
        </Field>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Preview</p>
          <Preview command={form} />
        </div>
      </form>
    </Modal>
  )
}

export default function CommandsPage() {
  const dispatch = useAppDispatch()
  const { data: commands, error, isLoading, refetch } = useGetCommandsQuery()
  const [deleteCommand] = useDeleteCommandMutation()
  const [reorderCommands] = useReorderCommandsMutation()
  const [editing, setEditing] = useState(null)

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const move = (index, delta) => reorderCommands(moved(commands.map((c) => c.id), index, delta))

  const remove = async (command) => {
    const ok = await dispatch(confirm({ title: 'Delete command?', message: `Visitors will no longer be able to run "${command.name}".`, confirmLabel: 'Delete', danger: true }))
    if (ok) deleteCommand(command.id)
  }

  return (
    <>
      <PageHeader
        title="Terminal"
        description="Extra commands visitors can run in the Terminal window. They're listed under “help”."
        actions={
          <Button onClick={() => setEditing(BLANK)}>
            <Plus className="h-4 w-4" /> New command
          </Button>
        }
      />

      {commands.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 p-10 text-center">
          <SquareTerminal className="h-8 w-8 text-sky-500" />
          <p className="text-sm text-slate-600 dark:text-slate-300">No custom commands yet. Built-ins like whoami, projects and skills always work.</p>
          <Button variant="glass" onClick={() => setEditing({ name: 'hire-me', description: 'Why we should work together', output: '' })}>
            Add your first command
          </Button>
        </Panel>
      ) : (
        <Panel className="divide-y divide-slate-900/5 overflow-hidden dark:divide-white/10">
          {commands.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{c.name}</p>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{c.description || c.output.split('\n')[0]}</p>
              </div>
              <Button variant="ghost" size="icon" aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Move ${c.name} down`} disabled={i === commands.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${c.name}`} onClick={() => remove(c)} className="hover:!bg-rose-500/10 hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Panel>
      )}

      {editing && <CommandForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
