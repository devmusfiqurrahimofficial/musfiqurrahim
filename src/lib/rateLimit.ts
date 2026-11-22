import { HttpError } from './validation'
import { logger } from './logger'

interface RateLimitOptions {
  max: number
  windowMs: number
  message?: string
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const hits = new Map<string, RateLimitEntry>()

// Periodic cleanup of expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(ip)
    }
  }, 60 * 1000).unref()
}

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim()
    // Validate IPv4 or IPv6 format to prevent header injection/spoofing
    if (/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(firstIp) || /^[a-fA-F0-9:]+$/.test(firstIp)) {
      return firstIp
    }
  }
  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) {
    const trimmed = xRealIp.trim()
    if (/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(trimmed) || /^[a-fA-F0-9:]+$/.test(trimmed)) {
      return trimmed
    }
  }
  return '127.0.0.1'
}

export function checkRateLimit(
  request: Request,
  { max, windowMs, message = 'Too many requests. Try again later.' }: RateLimitOptions
) {
  const ip = getClientIp(request)
  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + windowMs })
  } else if (++entry.count > max) {
    logger.warn({ ip, max, windowMs }, 'Rate limit threshold exceeded')
    throw new HttpError(429, message)
  }
}
