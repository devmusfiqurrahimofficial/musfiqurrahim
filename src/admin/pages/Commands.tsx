'use client'

import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { errorDetails } from '@/features/api/apiErrors'
import { moved } from '@/features/api/collectionEndpoints'
import {
  useDeleteCommandMutation,
  useGetCommandsQuery,
  useReorderCommandsMutation,
  useSaveCommandMutation,
} from '@/features/commands/commandsApi'
import { confirm } from '@/features/dialog/dialogThunks'
import { useAppDispatch } from '@/store/hooks'
import type { Command } from '@/types/models'
import { Button, ErrorState, Field, Input, Loading, Modal, PageHeader, Panel, TextArea } from '../ui'

const BLANK: Command = { name: '', description: '', output: '' }

function Preview({ command }: { command: Command }) {
  return (
    <div className="rounded-xl bg-[#060e1a]/90 p-3 font-mono text-[12px] leading-relaxed text-sky-100 shadow-inner">
      <div>
        <span className="text-sky-400">guest@portfolio ~ %</span> {command.name || 'your-command'}
      </div>
      <div className="whitespace-pre-wrap break-words">{command.output || ' '}</div>
    </div>
  )
}

function CommandForm({ initial, onClose }: { initial: Partial<Command>; onClose: () => void }) {
  const [saveCommand, { isLoading: busy, error }] = useSaveCommandMutation()
  const [form, setForm] = useState<Command>({ ...BLANK, ...initial })
  const errors = errorDetails(error)
  const set = (key: keyof Command) => (e: any) =>
    setForm({ ...form, [key]: key === 'name' ? e.target.value.toLowerCase() : e.target.value })

  const save = async (e: FormEvent) => {
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
            <Input
              value={form.name}
              onChange={set('name')}
              invalid={!!errors.name}
              required
              maxLength={24}
              className="font-mono"
            />
          </Field>
          <Field label="Description" hint="Shown in help">
            <Input value={form.description || ''} onChange={set('description')} maxLength={100} />
          </Field>
        </div>
        <Field label="Output" error={errors.output}>
          <TextArea
            value={form.output}
            onChange={set('output')}
            invalid={!!errors.output}
            required
            rows={5}
            className="font-mono text-xs"
            placeholder="Text printed when the command is run…"
          />
        </Field>
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Terminal Preview</span>
          <Preview command={form} />
        </div>
      </form>
    </Modal>
  )
}

export default function CommandsPage() {
  const dispatch = useAppDispatch()
  const { data: commands = [], isLoading, error, refetch } = useGetCommandsQuery()
  const [deleteCommand] = useDeleteCommandMutation()
  const [reorderCommands] = useReorderCommandsMutation()
  const [editing, setEditing] = useState<Partial<Command> | null>(null)

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const ids = commands.map((c: any) => c.id!)

  const remove = async (c: Command) => {
    const ok = await dispatch(
      confirm({
        title: `Delete ${c.name}?`,
        message: 'This custom command will no longer be available in the Terminal.',
        confirmLabel: 'Delete',
        danger: true,
      })
    )
    if (ok && c.id) deleteCommand(c.id)
  }

  const move = (index: number, delta: number) => {
    reorderCommands(moved(ids, index, delta))
  }

  return (
    <>
      <PageHeader
        title="Terminal Commands"
        description="Custom commands recognized by the Terminal window."
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> Add command
          </Button>
        }
      />

      <div className="space-y-3">
        {commands.map((c: any, i: number) => (
          <Panel key={c.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-mono text-sm font-semibold text-sky-600 dark:text-sky-400">{c.name}</span>
                {c.description && <span className="ml-3 text-xs text-slate-400">{c.description}</span>}
              </div>
              <div className="flex items-center gap-1">
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
                  disabled={i === commands.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(c)}
                  aria-label={`Delete ${c.name}`}
                  className="hover:!bg-rose-500/10 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 font-mono text-xs text-slate-600 dark:text-slate-300">{c.output}</p>
          </Panel>
        ))}
        {!commands.length && (
          <p className="p-6 text-center text-sm text-slate-500">
            No custom commands yet. Built-in commands (whoami, about, skills, projects, contact, etc.) are always available.
          </p>
        )}
      </div>

      {editing && <CommandForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
