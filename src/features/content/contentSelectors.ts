import { createSelector } from '@reduxjs/toolkit'
import { siteTitleOf } from '@/config/siteText'
import { profile, projects, skills, tools } from '@/data'
import type { PortfolioData } from '@/types/models'

const BUNDLED: PortfolioData = { profile, projects, skills, tools, commands: [] }

export const selectContent = (state: { content: { data: PortfolioData | null } }): PortfolioData =>
  state.content.data ?? BUNDLED

export const selectProfile = (state: any) => selectContent(state).profile

export const selectProjects = createSelector([(state: any) => selectContent(state).projects], (list) =>
  list.filter((p) => typeof p.name === 'string' && p.name)
)

export const selectSkills = (state: any) => selectContent(state).skills
export const selectTools = (state: any) => selectContent(state).tools
export const selectCommands = (state: any) => selectContent(state).commands
export const selectUpdatedAt = (state: any) => selectContent(state).updatedAt ?? null

export const selectSiteTitle = createSelector([selectProfile], siteTitleOf)

export const selectProjectCategories = createSelector([selectProjects], (list) => {
  const counts = new Map<string, number>()
  for (const p of list) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  return [{ name: 'All', count: list.length }, ...[...counts].map(([name, count]) => ({ name, count }))]
})

export const selectProjectsInCategory = createSelector(
  [selectProjects, (_state: any, category: string) => category],
  (list, category) => (category === 'All' ? list : list.filter((p) => p.category === category))
)

export const selectSkillCount = createSelector([selectSkills], (groups) =>
  groups.reduce((n, g) => n + g.items.length, 0)
)

export const selectCategoriesByCount = createSelector([selectProjectCategories], (categories): [string, number][] =>
  categories
    .slice(1)
    .map(({ name, count }): [string, number] => [name, count])
    .sort((a, b) => b[1] - a[1])
)
