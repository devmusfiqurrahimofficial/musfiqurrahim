import { parseId, uploads } from '@/lib/db'
import { handleApiError } from '@/lib/apiHelper'
import { HttpError } from '@/lib/validation'

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

  return new Response(dataBuffer, {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  })
}
