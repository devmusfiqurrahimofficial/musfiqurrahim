// Client half of the server's collectionRouter. The endpoint names are generated, so grep won't find them:
//   collectionEndpoints(build, { one: 'Project', many: 'Projects', path: '/projects' })
//   -> getProjects, saveProject, deleteProject, reorderProjects (tag 'Project')
import { apiSlice } from './apiSlice.js'

export function collectionEndpoints(build, { one, many, path }) {
  const list = { type: one, id: 'LIST' }
  const getName = `get${many}`

  // update the cache now, roll back if the request fails
  const optimistic = (recipe) => async (arg, { dispatch, queryFulfilled }) => {
    const patch = dispatch(apiSlice.util.updateQueryData(getName, undefined, (draft) => recipe(draft, arg)))
    try {
      await queryFulfilled
    } catch {
      patch.undo()
    }
  }

  return {
    [getName]: build.query({
      query: () => path,
      providesTags: (result = []) => [list, ...result.map(({ id }) => ({ type: one, id }))],
    }),

    // id -> PUT, no id -> POST. We write the response into the cache instead of invalidating:
    // a refetch would give every item a new identity and wipe unsaved drafts in other editors
    // (the Skills page has one per group).
    [`save${one}`]: build.mutation({
      query: ({ id, ...body }) => (id ? { url: `${path}/${id}`, method: 'PUT', body } : { url: path, method: 'POST', body }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const { data: saved } = await queryFulfilled.catch(() => ({}))
        if (!saved) return
        dispatch(
          apiSlice.util.updateQueryData(getName, undefined, (draft) => {
            const index = draft.findIndex((item) => item.id === saved.id)
            if (index === -1) draft.push(saved)
            else draft[index] = saved
          })
        )
      },
    }),

    [`delete${one}`]: build.mutation({
      query: (id) => ({ url: `${path}/${id}`, method: 'DELETE' }),
      onQueryStarted: optimistic((draft, id) => draft.filter((item) => item.id !== id)),
    }),

    // Body: every id, in the new order.
    [`reorder${many}`]: build.mutation({
      query: (ids) => ({ url: `${path}/reorder`, method: 'POST', body: { ids } }),
      onQueryStarted: optimistic((draft, ids) => ids.map((id) => draft.find((item) => item.id === id))),
    }),
  }
}

// take ids[from] out and put it back at index `to`; the items in between shift by one
export function arrayMove(ids, from, to) {
  const next = [...ids]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

// swap ids[index] with the one `delta` away (-1 = up, 1 = down)
export function moved(ids, index, delta) {
  const next = [...ids]
  ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
  return next
}
