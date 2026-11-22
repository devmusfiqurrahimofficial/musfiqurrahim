import { apiSlice } from '../api/apiSlice'
import { collectionEndpoints } from '../api/collectionEndpoints'
import type { Command } from '@/types/models'

export const commandsApi: any = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    ...collectionEndpoints<Command>(build, { one: 'Command', many: 'Commands', path: '/commands' }),
  }),
})

export const {
  useGetCommandsQuery,
  useSaveCommandMutation,
  useDeleteCommandMutation,
  useReorderCommandsMutation,
} = commandsApi
