import { createSelector } from '@reduxjs/toolkit'
import { projectsApi } from './projectsApi.js'

const EMPTY = []
const selectProjectsResult = projectsApi.endpoints.getProjects.select()

export const selectAdminProjects = createSelector([selectProjectsResult], (result) => result.data ?? EMPTY)

export const selectAdminCategories = createSelector([selectAdminProjects], (projects) => [...new Set(projects.map((p) => p.category))].sort())

// matches name, description or any tag
export const selectFilteredProjects = createSelector(
  [selectAdminProjects, (state, query) => query.trim().toLowerCase(), (state, query, category) => category],
  (projects, q, category) =>
    projects.filter((p) => (!category || p.category === category) && (!q || [p.name, p.description, ...(p.tags ?? [])].some((s) => s?.toLowerCase().includes(q))))
)
