import { describe, expect, it } from 'vitest'
import { contentDisposition } from './uploadHelper'

describe('contentDisposition', () => {
  it('produces a header value Response accepts for non-ASCII names', () => {
    const value = contentDisposition('Musfiqur Rahim — Resume (1).pdf')
    expect(value).toBe(
      `inline; filename="Musfiqur Rahim _ Resume (1).pdf"; filename*=UTF-8''Musfiqur%20Rahim%20%E2%80%94%20Resume%20%281%29.pdf`,
    )
    expect(() => new Response('x', { headers: { 'Content-Disposition': value } })).not.toThrow()
  })

  it('strips quotes and backslashes from the ASCII fallback', () => {
    expect(contentDisposition('a"b\\c.pdf')).toMatch(/^inline; filename="a_b_c\.pdf";/)
  })
})
