import { apiSlice } from '../api/apiSlice.js'
import { collectionEndpoints } from '../api/collectionEndpoints.js'

export const skillsApi = apiSlice.injectEndpoints({
  endpoints: (build) => collectionEndpoints(build, { one: 'SkillGroup', many: 'SkillGroups', path: '/skills' }),
})

export const { useGetSkillGroupsQuery, useSaveSkillGroupMutation, useDeleteSkillGroupMutation, useReorderSkillGroupsMutation } = skillsApi
