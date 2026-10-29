import { createSelector } from '@reduxjs/toolkit'
import { siteTitleOf } from '../../config/siteText.js'
import { profile, projects, skills, tools } from '../../data.js'

// data.js predates custom Terminal commands, so the bundled fallback has none.
const BUNDLED = { profile, projects, skills, tools, commands: [] }

export const selectContent = (state) => state.content.data ?? BUNDLED

export const selectProfile = (state) => selectContent(state).profile
export const selectProjects = (state) => selectContent(state).projects
export const selectSkills = (state) => selectContent(state).skills
export const selectTools = (state) => selectContent(state).tools
export const selectCommands = (state) => selectContent(state).commands
export const selectUpdatedAt = (state) => selectContent(state).updatedAt ?? null

export const selectSiteTitle = createSelector([selectProfile], siteTitleOf)

// [{ name: 'All', count }, { name: 'React', count }, …], first-seen order
export const selectProjectCategories = createSelector([selectProjects], (list) => {
  const counts = new Map()
  for (const p of list) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  return [{ name: 'All', count: list.length }, ...[...counts].map(([name, count]) => ({ name, count }))]
})

export const selectProjectsInCategory = createSelector([selectProjects, (state, category) => category], (list, category) =>
  category === 'All' ? list : list.filter((p) => p.category === category)
)

export const selectSkillCount = createSelector([selectSkills], (groups) => groups.reduce((n, g) => n + g.items.length, 0))

// admin dashboard wants [[category, count], …], biggest first
export const selectCategoriesByCount = createSelector([selectProjectCategories], (categories) =>
  categories
    .slice(1)
    .map(({ name, count }) => [name, count])
    .sort((a, b) => b[1] - a[1])
)
