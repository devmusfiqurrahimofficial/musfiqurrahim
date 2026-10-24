export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

// Thrown by a rule; validate() collects these into one 422 response.
class Invalid extends Error {}
const fail = (message) => {
  throw new Invalid(message)
}

const isBlank = (v) => v == null || (typeof v === 'string' && v.trim() === '')

export const string =
  ({ min = 0, max = 200, required = false, trim = true } = {}) =>
  (v) => {
    if (isBlank(v)) return required ? fail('is required') : ''
    if (typeof v !== 'string') fail('must be text')
    const s = trim ? v.trim() : v
    if (s.length < min) fail(`must be at least ${min} characters`)
    if (s.length > max) fail(`must be at most ${max} characters`)
    return s
  }

export const url =
  ({ required = false } = {}) =>
  (v) => {
    if (isBlank(v)) return required ? fail('is required') : ''
    if (typeof v !== 'string') fail('must be a URL')
    const s = v.trim()
    // Relative paths are allowed so images can point at files in /public.
    if (s.startsWith('/') && !s.startsWith('//')) return s
    let parsed
    try {
      parsed = new URL(s)
    } catch {
      fail('must be a valid URL')
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) fail('must start with http:// or https://')
    return s
  }

export const email =
  ({ required = false } = {}) =>
  (v) => {
    const s = string({ max: 254, required })(v)
    if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) fail('must be a valid email')
    return s.toLowerCase()
  }

export const integer =
  ({ min = -Infinity, max = Infinity } = {}) =>
  (v) => {
    if (typeof v !== 'number' || !Number.isInteger(v)) fail('must be a whole number')
    if (v < min || v > max) fail(`must be between ${min} and ${max}`)
    return v
  }

export const boolean = () => (v) => {
  if (typeof v !== 'boolean') fail('must be true or false')
  return v
}

// Adds an extra check on top of another rule's cleaned value.
export const refine = (rule, test, message) => (v) => {
  const out = rule(v)
  if (!test(out)) fail(message)
  return out
}

export const pattern = (regex, message) => (v) => {
  const s = string({ required: true })(v)
  if (!regex.test(s)) fail(message)
  return s
}

export const list =
  (item, { max = 50, unique = false } = {}) =>
  (v) => {
    if (v == null) return []
    if (!Array.isArray(v)) fail('must be a list')
    if (v.length > max) fail(`can have at most ${max} entries`)
    const out = v.map((x, i) => {
      try {
        return item(x)
      } catch (err) {
        if (err instanceof Invalid) fail(`entry ${i + 1} ${err.message}`)
        if (err instanceof HttpError) fail(`entry ${i + 1}: ${Object.entries(err.details).map(([k, m]) => `${k} ${m}`).join(', ')}`)
        throw err
      }
    })
    return unique ? [...new Set(out)] : out
  }

export const object = (shape) => (v) => validate(shape, v)

export function validate(shape, input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Request body must be a JSON object')
  }
  const out = {}
  const errors = {}
  for (const [key, rule] of Object.entries(shape)) {
    if (partial && !(key in input)) continue
    try {
      out[key] = rule(input[key])
    } catch (err) {
      if (err instanceof Invalid) errors[key] = err.message
      else if (err instanceof HttpError) errors[key] = Object.entries(err.details ?? {}).map(([k, m]) => `${k} ${m}`).join(', ') || err.message
      else throw err
    }
  }
  if (Object.keys(errors).length) throw new HttpError(422, 'Some fields need fixing', errors)
  return out
}
