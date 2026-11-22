import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/apiHelper'
import { sendToOwner } from '@/lib/mailer'
import { mailSchema } from '@/lib/schemas'
import { validate } from '@/lib/validation'

export async function POST(req: Request) {
  try {
    await requireAuth(req)
    const body = await req.json().catch(() => ({}))
    const validated = validate(mailSchema, body)
    const to = await sendToOwner(validated)
    return NextResponse.json({ ok: true, to })
  } catch (err) {
    return handleApiError(err)
  }
}
