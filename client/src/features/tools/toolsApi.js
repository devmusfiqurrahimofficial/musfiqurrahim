import { apiSlice } from '../api/apiSlice.js'

export const toolsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getTools: build.query({
      query: () => '/tools',
      transformResponse: (body) => body.tools,
      providesTags: ['Tools'],
    }),
    updateTools: build.mutation({
      query: (tools) => ({ url: '/tools', method: 'PUT', body: { tools } }),
      async onQueryStarted(tools, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({}))
        if (data) dispatch(toolsApi.util.upsertQueryData('getTools', undefined, data.tools))
      },
    }),
  }),
})

export const { useGetToolsQuery, useUpdateToolsMutation } = toolsApi
