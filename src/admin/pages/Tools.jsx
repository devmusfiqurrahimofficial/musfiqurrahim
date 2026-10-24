import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Button, ErrorState, Loading, PageHeader, Panel, TagInput, useResource, useUi } from '../ui.jsx'

export default function ToolsPage() {
  const { toast } = useUi()
  const { data, error, loading, reload, setData } = useResource('/tools')
  const [tools, setTools] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data) setTools(data.tools)
  }, [data])

  if (loading) return <Loading />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const dirty = JSON.stringify(tools) !== JSON.stringify(data.tools)

  const save = async () => {
    setBusy(true)
    try {
      setData(await api('/tools', { method: 'PUT', body: { tools } }))
      toast('Tools saved')
    } catch (err) {
      toast(err.details?.tools || err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Tools"
        description={'The "Also comfortable with" chips in the Skills window.'}
        actions={
          <>
            {dirty && (
              <Button variant="glass" onClick={() => setTools(data.tools)}>
                Discard
              </Button>
            )}
            <Button onClick={save} busy={busy} disabled={!dirty}>
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
