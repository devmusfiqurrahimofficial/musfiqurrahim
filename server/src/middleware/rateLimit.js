import { HttpError } from '../utils/validation.js'

// Fixed-window, in-memory, per-IP. Enough for one process; behind a proxy set TRUST_PROXY so req.ip is the client.
export function rateLimit({ max, windowMs, message = 'Too many requests. Try again later.' }) {
  const hits = new Map()
  setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip)
  }, windowMs).unref()

  return (req, res, next) => {
    const now = Date.now()
    const entry = hits.get(req.ip)
    if (!entry || entry.resetAt <= now) hits.set(req.ip, { count: 1, resetAt: now + windowMs })
    else if (++entry.count > max) throw new HttpError(429, message)
    next()
  }
}
