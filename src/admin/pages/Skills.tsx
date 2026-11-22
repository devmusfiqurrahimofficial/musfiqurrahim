'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { errorDetails, errorMessage } from '@/features/api/apiErrors'
import { moved } from '@/features/api/collectionEndpoints'
import { confirm } from '@/features/dialog/dialogThunks'
import {
  useDeleteSkillGroupMutation,
  useGetSkillGroupsQuery,
  useReorderSkillGroupsMutation,
  useSaveSkillGroupMutation,
} from '@/features/skills/skillsApi'
import { useAppDispatch } from '@/store/hooks'
import type { SkillGroup, SkillItem } from '@/types/models'
import { Button, ErrorState, Input, Loading, PageHeader, Panel } from '../ui'

function GroupEditor({
  group,
  isFirst,
  isLast,
  onMove,
  onDelete,
}: {
  group: SkillGroup
  isFirst: boolean
  isLast: boolean
  onMove: (delta: number) => void
  onDelete: () => void
}) {
  const [saveGroup, { isLoading: busy, error: saveError }] = useSaveSkillGroupMutation()
  const [form, setForm] = useState<SkillGroup>(group)
  useEffect(() => setForm(group), [group])
  const dirty = JSON.stringify(form) !== JSON.stringify(group)
  const details = errorDetails(saveError)
  const error =
    saveError && (Object.keys(details).length ? Object.values(details).join('; ') : errorMessage(saveError))

  const setItem = (i: number, patch: Partial<SkillItem>) =>
    setForm({ ...form, items: form.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })
  const save = () => saveGroup(form)

  return (
    <Panel className="p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={form.group}
          onChange={(e) => setForm({ ...form, group: e.target.value })}
          aria-label="Group name"
          className="max-w-xs !text-base font-semibold"
        />
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Move group up" disabled={isFirst} onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Move group down" disabled={isLast} onClick={() => onMove(1)}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${group.group}`}
            onClick={onDelete}
            className="hover:!bg-rose-500/10 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {form.items.map((item, i) => (
          <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
            <Input
              value={item.name}
              onChange={(e) => setItem(i, { name: e.target.value })}
              placeholder="Skill"
              aria-label={`Skill ${i + 1} name`}
              className="sm:max-w-64"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={item.level}
              onChange={(e) => setItem(i, { level: Number(e.target.value) })}
              aria-label={`${item.name || `Skill ${i + 1}`} level`}
              className="min-w-24 flex-1 accent-sky-500"
            />
            <span className="w-10 text-right text-sm tabular-nums text-slate-500 dark:text-slate-400">
              {item.level}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${item.name || `skill ${i + 1}`}`}
              onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-900/5 pt-3 dark:border-white/10">
        <Button
          variant="glass"
          size="sm"
          onClick={() => setForm({ ...form, items: [...form.items, { name: '', level: 70 }] })}
        >
          <Plus className="h-3.5 w-3.5" /> Add skill
        </Button>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
          {dirty && (
            <Button variant="ghost" size="sm" onClick={() => setForm(group)}>
              Discard
            </Button>
          )}
          <Button size="sm" busy={busy} disabled={!dirty} onClick={save}>
            Save group
          </Button>
        </div>
      </div>
    </Panel>
  )
}

export default function SkillsPage() {
  const dispatch = useAppDispatch()
  const { data: groups = [], isLoading, error, refetch } = useGetSkillGroupsQuery()
  const [saveSkillGroup] = useSaveSkillGroupMutation()
  const [deleteSkillGroup] = useDeleteSkillGroupMutation()
  const [reorderSkillGroups] = useReorderSkillGroupsMutation()

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const ids = groups.map((g: any) => g.id!)

  const addGroup = async () => {
    saveSkillGroup({ group: 'New Group', items: [] })
  }

  const removeGroup = async (g: SkillGroup) => {
    const ok = await dispatch(
      confirm({
        title: `Delete ${g.group}?`,
        message: 'All skills in this group will be deleted.',
        confirmLabel: 'Delete',
        danger: true,
      })
    )
    if (ok && g.id) deleteSkillGroup(g.id)
  }

  const move = (index: number, delta: number) => {
    reorderSkillGroups(moved(ids, index, delta))
  }

  return (
    <>
      <PageHeader
        title="Skills"
        description="The proficiency bars shown in the Skills window."
        actions={
          <Button onClick={addGroup}>
            <Plus className="h-4 w-4" /> New skill group
          </Button>
        }
      />
      <div className="space-y-4">
        {groups.map((group: any, i: number) => (
          <GroupEditor
            key={group.id}
            group={group}
            isFirst={i === 0}
            isLast={i === groups.length - 1}
            onMove={(delta) => move(i, delta)}
            onDelete={() => removeGroup(group)}
          />
        ))}
      </div>
    </>
  )
}
