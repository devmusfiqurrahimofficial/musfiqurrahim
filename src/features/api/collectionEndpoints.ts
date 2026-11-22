import { apiSlice } from './apiSlice'

interface CollectionConfig {
  one: string
  many: string
  path: string
}

export function collectionEndpoints<T extends { id?: string }>(
  build: any,
  { one, many, path }: CollectionConfig
) {
  const list = { type: one, id: 'LIST' }
  const getName = `get${many}`

  const optimistic =
    (recipe: (draft: T[], arg: any) => any) =>
    async (arg: any, { dispatch, queryFulfilled }: { dispatch: any; queryFulfilled: Promise<any> }) => {
      const patch = dispatch(
        (apiSlice.util as any).updateQueryData(getName, undefined, (draft: any) => recipe(draft, arg))
      )
      try {
        await queryFulfilled
      } catch {
        patch.undo()
      }
    }

  return {
    [getName]: build.query({
      query: () => path,
      providesTags: (result: T[] = []) => [list, ...result.map((item) => ({ type: one, id: item.id || '' }))],
    }),

    [`save${one}`]: build.mutation({
      query: ({ id, ...body }: any) =>
        id ? { url: `${path}/${id}`, method: 'PUT', body } : { url: path, method: 'POST', body },
      async onQueryStarted(arg: any, { dispatch, queryFulfilled }: any) {
        try {
          const { data: saved } = await queryFulfilled
          if (!saved) return
          dispatch(
            (apiSlice.util as any).updateQueryData(getName, undefined, (draft: any) => {
              const index = draft.findIndex((item: T) => item.id === saved.id)
              if (index === -1) draft.push(saved)
              else draft[index] = saved
            })
          )
        } catch {
          // ignore
        }
      },
    }),

    [`delete${one}`]: build.mutation({
      query: (id: string) => ({ url: `${path}/${id}`, method: 'DELETE' }),
      onQueryStarted: optimistic((draft, id) => draft.filter((item: T) => item.id !== id)),
    }),

    [`reorder${many}`]: build.mutation({
      query: (ids: string[]) => ({ url: `${path}/reorder`, method: 'POST', body: { ids } }),
      onQueryStarted: optimistic((draft, ids: string[]) => ids.map((id) => draft.find((item: T) => item.id === id)!)),
    }),
  }
}

export function arrayMove<T>(ids: T[], from: number, to: number): T[] {
  const next = [...ids]
  const [removed] = next.splice(from, 1)
  if (removed !== undefined) next.splice(to, 0, removed)
  return next
}

export function moved<T>(ids: T[], index: number, delta: number): T[] {
  const next = [...ids]
  ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
  return next
}
