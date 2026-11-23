import { describe, expect, it } from 'vitest'
import { profileSchema } from './schemas'

describe('profileSchema', () => {
  it('validates profile with resumeUrl and image', () => {
    const valid = {
      name: 'Test Dev',
      role: 'Full-Stack Engineer',
      image: '/api/uploads/65f1a2b3c4d5e6f7a8b9c0d1',
      resumeUrl: '/api/uploads/65f1a2b3c4d5e6f7a8b9c0d2',
    }
    const parsed = profileSchema.parse(valid)
    expect(parsed.name).toBe('Test Dev')
    expect(parsed.image).toBe('/api/uploads/65f1a2b3c4d5e6f7a8b9c0d1')
    expect(parsed.resumeUrl).toBe('/api/uploads/65f1a2b3c4d5e6f7a8b9c0d2')
  })

  it('accepts external https links for resume and image', () => {
    const valid = {
      name: 'Test Dev',
      image: 'https://example.com/avatar.jpg',
      resumeUrl: 'https://drive.google.com/file/d/123/view',
    }
    const parsed = profileSchema.parse(valid)
    expect(parsed.resumeUrl).toBe('https://drive.google.com/file/d/123/view')
  })

  it('rejects unsafe protocols for resumeUrl and image', () => {
    expect(() =>
      profileSchema.parse({
        name: 'Test Dev',
        resumeUrl: 'javascript:alert(1)',
      })
    ).toThrow()

    expect(() =>
      profileSchema.parse({
        name: 'Test Dev',
        image: 'data:text/html,<script>alert(1)</script>',
      })
    ).toThrow()
  })

  it('defaults resumeUrl to empty string when omitted', () => {
    const parsed = profileSchema.parse({ name: 'Test Dev' })
    expect(parsed.resumeUrl).toBe('')
  })
})
