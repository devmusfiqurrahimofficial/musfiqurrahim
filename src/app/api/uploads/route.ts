import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { uploads } from '@/lib/db'
import { handleApiError } from '@/lib/apiHelper'
import { HttpError } from '@/lib/validation'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function sniffImageType(buf: Buffer): string | null {
  const ascii = (start: number, end: number) => buf.toString('latin1', start, end)
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return 'image/gif'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

export async function POST(req: Request) {
  try {
    await requireAuth(req)
    const formData = await req.formData()
    const file = formData.get('image') as File | null

    if (!file) throw new HttpError(400, 'No image file provided.')
    if (file.size > MAX_SIZE) throw new HttpError(413, 'Image must be under 10 MB.')
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new HttpError(422, 'Only JPG, PNG, WEBP and GIF images are allowed.')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = sniffImageType(buffer)
    if (!contentType) throw new HttpError(422, 'Only JPG, PNG, WEBP and GIF images are allowed.')

    const uploadsColl = await uploads()
    const { insertedId } = await uploadsColl.insertOne({
      contentType,
      data: buffer,
      createdAt: new Date(),
    })

    const urlObj = new URL(req.url)
    const url = `${urlObj.protocol}//${urlObj.host}/api/uploads/${insertedId}`
    return NextResponse.json({ url })
  } catch (err) {
    return handleApiError(err)
  }
}
