import { afterEach, describe, expect, it, vi } from 'vitest'
import { signedOut } from '../features/auth/authActions'
import { confirmSettled, selectDialog } from '../features/dialog/dialogSlice'
import { confirm } from '../features/dialog/dialogThunks'
import { errorRaised } from '../features/errors/errorsReducer'
import { selectErrors } from '../features/errors/errorsSelectors'
import { selectToasts } from '../features/notifications/notificationsSlice'
import { projectsApi } from '../features/projects/projectsApi'
import { selectAdminProjects } from '../features/projects/projectsSelectors'
import { setupStore } from './setupStore'

const json = (status: number, body: any) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const projects = [
  { id: 'a', name: 'A', category: 'X' },
  { id: 'b', name: 'B', category: 'X' },
] as any

const storeWithProjects = async () => {
  const store = setupStore()
  await store.dispatch(projectsApi.util.upsertQueryData('getProjects', undefined, projects))
  return store
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('store', () => {
  it('confirm() resolves with the answer given in the dialog', async () => {
    const store = setupStore()
    const answer = store.dispatch(confirm({ title: 'Delete?', message: 'Sure?' }))
    const dialog = selectDialog(store.getState())
    store.dispatch(confirmSettled({ id: dialog?.id, ok: true }))
    await expect(answer).resolves.toBe(true)
    expect(selectDialog(store.getState())).toBeNull()
  })

  it('signing out closes an open dialog and clears the error log (extraReducers on another feature)', async () => {
    const store = setupStore()
    const answer = store.dispatch(confirm({ title: 'Delete?' }))
    store.dispatch(errorRaised({ message: 'Boom', source: 'test' }))
    store.dispatch(signedOut())
    await expect(answer).resolves.toBe(false)
    expect(selectDialog(store.getState())).toBeNull()
    expect(selectErrors(store.getState())).toEqual([])
  })

  it('a logged error becomes a toast that dismisses itself', async () => {
    vi.useFakeTimers()
    const store = setupStore()
    store.dispatch(errorRaised({ message: 'Boom', source: 'test' }))
    expect(selectToasts(store.getState())).toMatchObject([{ message: 'Boom', type: 'error' }])
    await vi.advanceTimersByTimeAsync(3600)
    expect(selectToasts(store.getState())).toEqual([])
  })

  it('reorder is optimistic and kept when the server agrees', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, [projects[1], projects[0]])))
    const store = await storeWithProjects()
    const request = store.dispatch(projectsApi.endpoints.reorderProjects.initiate(['b', 'a']))
    expect(selectAdminProjects(store.getState()).map((p: any) => p.id)).toEqual(['b', 'a'])
    await request
    expect(selectAdminProjects(store.getState()).map((p: any) => p.id)).toEqual(['b', 'a'])
  })

  it('a failed delete is undone and reported through the global error handler', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(500, { error: 'Something went wrong' })))
    const store = await storeWithProjects()
    const request = store.dispatch(projectsApi.endpoints.deleteProject.initiate('a'))
    expect(selectAdminProjects(store.getState()).map((p: any) => p.id)).toEqual(['b'])
    await request
    expect(selectAdminProjects(store.getState()).map((p: any) => p.id)).toEqual(['a', 'b'])
    expect(selectErrors(store.getState())).toMatchObject([{ message: 'Something went wrong', source: 'deleteProject' }])
  })

  it('field errors from a save stay with the form instead of the error log', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(422, { error: 'Some fields need fixing', details: { name: 'is required' } }))
    )
    const store = await storeWithProjects()
    const result: any = await store.dispatch(projectsApi.endpoints.saveProject.initiate({ id: 'a', name: '' }))
    expect(result.error.data.details).toEqual({ name: 'is required' })
    expect(selectErrors(store.getState())).toEqual([])
  })
})
