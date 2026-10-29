import { useEffect, useState } from 'react'
import { useGetToolsQuery, useUpdateToolsMutation } from '../../features/tools/toolsApi.js'
import { Button, ErrorState, Loading, PageHeader, Panel, TagInput } from '../ui.jsx'

export default function ToolsPage() {
  const { data: saved, error, isLoading, refetch } = useGetToolsQuery()
  const [updateTools, { isLoading: busy }] = useUpdateToolsMutation()
  const [tools, setTools] = useState([])

  useEffect(() => {
    if (saved) setTools(saved)
  }, [saved])

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={refetch} />

  const dirty = JSON.stringify(tools) !== JSON.stringify(saved)

  return (
    <>
      <PageHeader
        title="Tools"
        description={'The "Also comfortable with" chips in the Skills window.'}
        actions={
          <>
            {dirty && (
              <Button variant="glass" onClick={() => setTools(saved)}>
                Discard
              </Button>
            )}
            <Button onClick={() => updateTools(tools)} busy={busy} disabled={!dirty}>
              Save changes
            </Button>
          </>
        }
      />
      <Panel className="p-6">
        <TagInput value={tools} onChange={setTools} placeholder="Add a tool and press Enter" />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{tools.length} tools. Backspace in the empty field removes the last one.</p>
      </Panel>
    </>
  )
}
