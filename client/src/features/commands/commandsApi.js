import { apiSlice } from '../api/apiSlice.js'
import { collectionEndpoints } from '../api/collectionEndpoints.js'

export const commandsApi = apiSlice.injectEndpoints({
  endpoints: (build) => collectionEndpoints(build, { one: 'Command', many: 'Commands', path: '/commands' }),
})

export const { useGetCommandsQuery, useSaveCommandMutation, useDeleteCommandMutation, useReorderCommandsMutation } = commandsApi
