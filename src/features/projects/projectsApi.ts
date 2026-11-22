import { apiSlice } from '../api/apiSlice'
import { collectionEndpoints } from '../api/collectionEndpoints'
import type { Project } from '@/types/models'

export const projectsApi: any = apiSlice.injectEndpoints({
  endpoints: (build) =>
    collectionEndpoints<Project>(build, { one: 'Project', many: 'Projects', path: '/projects' }),
})

export const {
  useGetProjectsQuery,
  useSaveProjectMutation,
  useDeleteProjectMutation,
  useReorderProjectsMutation,
} = projectsApi
