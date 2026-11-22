import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { messages, toApi } from '@/lib/db'
import { handleApiError } from '@/lib/apiHelper'
import { checkRateLimit } from '@/lib/rateLimit'
import { messageSchema } from '@/lib/schemas'
import { validate } from '@/lib/validation'

export async function POST(req: Request) {
  try {
    checkRateLimit(req, {
      max: 5,
      windowMs: 10 * 60 * 1000,
      message: 'Too many messages. Try again in a few minutes.',
    })

    const body = await req.json().catch(() => ({}))
    const { website, ...message } = validate(messageSchema, body)

    // Bots fill the hidden field; tell them it worked and keep nothing.
    if (!website) {
      const messagesColl = await messages()
      await messagesColl.insertOne({
        ...message,
        read: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(req: Request) {
  try {
    await requireAuth(req)
    const messagesColl = await messages()
    const list = await messagesColl.find().sort({ createdAt: -1 }).limit(500).toArray()
    return NextResponse.json(list.map(toApi))
  } catch (err) {
    return handleApiError(err)
  }
}
