import { describe, expect, it } from 'vitest'
import { profileSchema } from './schemas'
import { contentDisposition } from './uploadHelper'
import { normalizeProfileUrls, relativeUploadUrl, resumeLink } from './uploadUrl'

const ID = '6b03396ad36d57b59ef9fd93'

describe('relativeUploadUrl', () => {
  it('drops the host from upload links (localhost or any domain)', () => {
    expect(relativeUploadUrl(`http://localhost:3000/api/uploads/${ID}`)).toBe(`/api/uploads/${ID}`)
    expect(relativeUploadUrl(`https://www.example.dev/api/uploads/${ID}?x=1`)).toBe(`/api/uploads/${ID}`)
  })

  it('leaves other links alone', () => {
    for (const url of ['/resume.pdf', `/api/uploads/${ID}`, 'https://drive.google.com/file/d/abc/view', ''])
      expect(relativeUploadUrl(url)).toBe(url)
  })
})

describe('normalizeProfileUrls', () => {
  it('fixes image and resumeUrl', () => {
    const p = normalizeProfileUrls({ image: `https://a.dev/api/uploads/${ID}`, resumeUrl: `http://localhost:3000/api/uploads/${ID}` })
    expect(p).toEqual({ image: `/api/uploads/${ID}`, resumeUrl: `/api/uploads/${ID}` })
  })
})

describe('profileSchema', () => {
  it('stores uploads without a host', () => {
    const parsed = profileSchema.parse({ name: 'X', resumeUrl: `http://localhost:3000/api/uploads/${ID}` })
    expect(parsed.resumeUrl).toBe(`/api/uploads/${ID}`)
  })
})

describe('resumeLink', () => {
  it('downloads our own uploads through ?download=1', () => {
    expect(resumeLink(`http://localhost:3000/api/uploads/${ID}`)).toEqual({ href: `/api/uploads/${ID}?download=1`, external: false })
  })
  it('falls back to the bundled /resume.pdf', () => {
    expect(resumeLink('')).toEqual({ href: '/resume.pdf', external: false })
  })
  it('opens external links in a new tab', () => {
    expect(resumeLink('https://drive.google.com/file/d/abc/view').external).toBe(true)
  })
})

describe('contentDisposition', () => {
  it('can force a download', () => {
    expect(contentDisposition('cv.pdf', 'attachment')).toMatch(/^attachment; filename="cv\.pdf";/)
  })
})
