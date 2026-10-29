import { apiSlice } from '../api/apiSlice.js'
import { collectionEndpoints } from '../api/collectionEndpoints.js'

export const projectsApi = apiSlice.injectEndpoints({
  endpoints: (build) => collectionEndpoints(build, { one: 'Project', many: 'Projects', path: '/projects' }),
})

export const { useGetProjectsQuery, useSaveProjectMutation, useDeleteProjectMutation, useReorderProjectsMutation } = projectsApi
