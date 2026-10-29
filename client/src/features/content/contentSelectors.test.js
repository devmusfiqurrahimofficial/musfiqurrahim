// Content selectors: the bundled fallback, the snapshot from the API, and memoized derived lists.
import { describe, expect, it } from 'vitest'
import { profile as bundledProfile } from '../../data.js'
import { contentSlice } from './contentSlice.js'
import { fetchPortfolio } from './contentThunks.js'
import { selectCommands, selectProfile, selectProjectCategories, selectProjectsInCategory, selectSiteTitle } from './contentSelectors.js'

const project = (name, category) => ({ id: name, name, category, tags: [] })
const apiContent = {
  profile: { name: 'Ada Lovelace', siteTitle: '' },
  projects: [project('A', 'React'), project('B', 'Client Work'), project('C', 'React')],
  skills: [],
  tools: [],
}
const withContent = (data) => ({ content: { data, status: 'live' } })

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
    expect(contentSlice.reducer({ data: null, status: 'loading' }, fetchPortfolio.rejected(new Error('down'), 'id')).status).toBe('offline')
  })

  it('derives the site title from the profile', () => {
    expect(selectSiteTitle(withContent(apiContent))).toBe('Ada Lovelace — Portfolio')
  })

  it('counts categories in first-seen order', () => {
    expect(selectProjectCategories(withContent(apiContent))).toEqual([
      { name: 'All', count: 3 },
      { name: 'React', count: 2 },
      { name: 'Client Work', count: 1 },
    ])
  })

  it('filters by category, and returns the same array while the inputs are unchanged', () => {
    const state = withContent(apiContent)
    const react = selectProjectsInCategory(state, 'React')
    expect(react.map((p) => p.name)).toEqual(['A', 'C'])
    expect(selectProjectsInCategory(state, 'React')).toBe(react)
    expect(selectProjectsInCategory(state, 'All')).toBe(apiContent.projects)
  })
})
