import { apiSlice } from '../api/apiSlice'

export const toolsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getTools: build.query<string[], void>({
      query: () => '/tools',
      transformResponse: (body: { tools: string[] }) => body.tools,
      providesTags: ['Tools'],
    }),
    updateTools: build.mutation<{ tools: string[] }, string[]>({
      query: (tools) => ({ url: '/tools', method: 'PUT', body: { tools } }),
      async onQueryStarted(tools, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data) dispatch(toolsApi.util.upsertQueryData('getTools', undefined, data.tools))
        } catch {
          // ignore
        }
      },
    }),
  }),
})

export const { useGetToolsQuery, useUpdateToolsMutation } = toolsApi
