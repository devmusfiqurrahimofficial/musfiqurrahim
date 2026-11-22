import { describe, expect, it } from 'vitest'
import { profile as bundledProfile } from '@/data'
import type { PortfolioData, Project } from '@/types/models'
import { contentSlice } from './contentSlice'
import { fetchPortfolio } from './contentThunks'
import {
  selectCommands,
  selectProfile,
  selectProjectCategories,
  selectProjects,
  selectProjectsInCategory,
  selectSiteTitle,
} from './contentSelectors'

const project = (name: string, category: string): Project => ({
  id: name,
  name,
  category,
  tags: [],
})

const apiContent: PortfolioData = {
  profile: { name: 'Ada Lovelace', siteTitle: '' } as any,
  projects: [project('A', 'React'), project('B', 'Client Work'), project('C', 'React')],
  skills: [],
  tools: [] as any,
  commands: [],
}

const withContent = (data: PortfolioData) => ({ content: { data, status: 'live' as const } })

describe('content', () => {
  it('falls back to the bundled data.js before the API has ever answered', () => {
    const state = { content: contentSlice.reducer(undefined, { type: '@@init' }) }
    expect(selectProfile(state)).toBe(bundledProfile)
    expect(selectCommands(state)).toEqual([])
  })

  it('stores what fetchPortfolio returns and marks it live', () => {
    const content = contentSlice.reducer(undefined, fetchPortfolio.fulfilled(apiContent, 'request-id'))
    expect(content).toEqual({ data: apiContent, status: 'live' })
  })

  it('a failed first fetch is "offline", but a superseded (aborted) one changes nothing', () => {
    const aborted = fetchPortfolio.rejected(new DOMException('Aborted', 'AbortError'), 'id')
    aborted.meta.aborted = true
    expect(contentSlice.reducer({ data: null, status: 'loading' }, aborted).status).toBe('loading')
    expect(
      contentSlice.reducer({ data: null, status: 'loading' }, fetchPortfolio.rejected(new Error('down'), 'id')).status
    ).toBe('offline')
  })

  it('derives the site title from the profile', () => {
    expect(selectSiteTitle(withContent(apiContent) as any)).toBe('Ada Lovelace — Portfolio')
  })

  it('skips projects without a name', () => {
    const foreign = { id: 'x', title: 'ShopSphere', category: 'React' } as any
    const state = withContent({ ...apiContent, projects: [foreign, ...apiContent.projects] })
    expect(selectProjects(state as any).map((p) => p.name)).toEqual(['A', 'B', 'C'])
    expect(selectProjectCategories(state as any)[0]).toEqual({ name: 'All', count: 3 })
  })

  it('counts categories in first-seen order', () => {
    expect(selectProjectCategories(withContent(apiContent) as any)).toEqual([
      { name: 'All', count: 3 },
      { name: 'React', count: 2 },
      { name: 'Client Work', count: 1 },
    ])
  })

  it('filters by category, and returns the same array while the inputs are unchanged', () => {
    const state = withContent(apiContent) as any
    const react = selectProjectsInCategory(state, 'React')
    expect(react.map((p) => p.name)).toEqual(['A', 'C'])
    expect(selectProjectsInCategory(state, 'React')).toBe(react)
    expect(selectProjectsInCategory(state, 'All')).toBe(selectProjects(state))
  })
})
