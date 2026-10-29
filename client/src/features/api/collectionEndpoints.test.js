import { describe, expect, it } from 'vitest'
import { arrayMove, moved } from './collectionEndpoints.js'

describe('arrayMove', () => {
  it('moves an item down, shifting the ones it passes up', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item up, shifting the ones it passes down', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('returns a copy when nothing moves', () => {
    const ids = ['a', 'b']
    const next = arrayMove(ids, 1, 1)
    expect(next).toEqual(ids)
    expect(next).not.toBe(ids)
  })

  it('agrees with moved() for a one-step move', () => {
    expect(arrayMove(['a', 'b', 'c'], 1, 2)).toEqual(moved(['a', 'b', 'c'], 1, 1))
  })
})
