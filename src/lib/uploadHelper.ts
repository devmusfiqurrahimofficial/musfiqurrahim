import { parseId, uploads } from '@/lib/db'
import { HttpError } from '@/lib/validation'

/**
 * HTTP headers may only contain ByteString (Latin-1) characters, so a name like
 * "Rahim — Resume.pdf" would make `new Response()` throw. Send an ASCII-only
 * `filename` fallback plus the exact name UTF-8 encoded in `filename*` (RFC 6266).
 */
export function contentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'file'
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
  return `inline; filename="${ascii}"; filename*=UTF-8''${encoded}`
}

export async function getUploadedImageResponse(id: string): Promise<Response> {
  const _id = parseId(id)
  if (!_id) throw new HttpError(404, 'Not found')

  const uploadsColl = await uploads()
  const file = await uploadsColl.findOne({ _id })
  if (!file) throw new HttpError(404, 'Not found')

  const dataBuffer = Buffer.isBuffer(file.data)
    ? file.data
    : (file.data as any)?.buffer
      ? Buffer.from((file.data as any).buffer)
      : Buffer.from(file.data as any)

  const isPdf = file.contentType === 'application/pdf'
  const filename = String((file as any).name || (isPdf ? 'resume.pdf' : 'image'))

  return new Response(dataBuffer, {
    headers: {
      'Content-Type': file.contentType || (isPdf ? 'application/pdf' : 'application/octet-stream'),
      'Content-Disposition': contentDisposition(filename),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Content-Security-Policy': isPdf
        ? "default-src 'self' 'unsafe-inline'; object-src 'self'"
        : "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  })
}
