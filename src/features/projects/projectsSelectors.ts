import { createSelector } from '@reduxjs/toolkit'
import type { Project } from '@/types/models'
import { projectsApi } from './projectsApi'

const EMPTY: Project[] = []
const selectProjectsResult = (projectsApi as any).endpoints.getProjects.select()

export const selectAdminProjects = createSelector([selectProjectsResult], (result: any) => result?.data ?? EMPTY)

export const selectAdminCategories = createSelector([selectAdminProjects], (projects: Project[]) =>
  [...new Set(projects.map((p) => p.category))].sort()
)

export const selectFilteredProjects = createSelector(
  [
    selectAdminProjects,
    (_state: any, query: string) => query.trim().toLowerCase(),
    (_state: any, _query: string, category: string) => category,
  ],
  (projects: Project[], q: string, category: string) =>
    projects.filter(
      (p) =>
        (!category || p.category === category) &&
        (!q ||
          [p.name, p.description, ...(p.tags ?? [])].some((s) => s?.toLowerCase().includes(q)))
    )
)
