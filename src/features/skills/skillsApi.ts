import { apiSlice } from '../api/apiSlice'
import { collectionEndpoints } from '../api/collectionEndpoints'
import type { SkillGroup } from '@/types/models'

export const skillsApi: any = apiSlice.injectEndpoints({
  endpoints: (build) =>
    collectionEndpoints<SkillGroup>(build, { one: 'SkillGroup', many: 'SkillGroups', path: '/skills' }),
})

export const {
  useGetSkillGroupsQuery,
  useSaveSkillGroupMutation,
  useDeleteSkillGroupMutation,
  useReorderSkillGroupsMutation,
} = skillsApi
