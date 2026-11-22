import { z } from 'zod'

export class HttpError extends Error {
  status: number
  details?: Record<string, string>

  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}

export class Invalid extends Error {}

export function validate<T>(
  schema: z.ZodType<T> | Record<string, any>,
  input: unknown,
  { partial = false }: { partial?: boolean } = {}
): T {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Request body must be a JSON object')
  }

  // Native Zod schema validation
  if (schema instanceof z.ZodType) {
    const effectiveSchema =
      partial && 'partial' in schema && typeof (schema as any).partial === 'function'
        ? (schema as any).partial()
        : schema

    const result = effectiveSchema.safeParse(input)
    if (!result.success) {
      const details: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || 'root'
        if (!details[path]) {
          details[path] = issue.message
        }
      }
      throw new HttpError(422, 'Some fields need fixing', details)
    }
    return result.data as T
  }

  // Fallback for custom shape dictionaries
  const shape = schema as Record<string, (v: unknown) => unknown>
  const inObj = input as Record<string, unknown>
  const out = {} as Record<string, unknown>
  const errors: Record<string, string> = {}

  for (const key of Object.keys(shape)) {
    if (partial && !(key in inObj)) continue
    try {
      out[key] = shape[key](inObj[key])
    } catch (err) {
      if (err instanceof Invalid) {
        errors[key] = err.message
      } else if (err instanceof HttpError) {
        errors[key] =
          Object.entries(err.details ?? {})
            .map(([f, m]) => `${f} ${m}`)
            .join(', ') || err.message
      } else {
        throw err
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(422, 'Some fields need fixing', errors)
  }
  return out as T
}
