import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { settings, touch } from '@/lib/db'
import { handleApiError } from '@/lib/apiHelper'
import { toolsSchema } from '@/lib/schemas'
import { validate } from '@/lib/validation'

export async function GET() {
  try {
    const settingsColl = await settings()
    const doc = await settingsColl.findOne({ _id: 'tools' as any })
    return NextResponse.json({ tools: (doc as any)?.tools ?? [] })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: Request) {
  try {
    await requireAuth(req)
    const body = await req.json().catch(() => ({}))
    const { tools: newTools } = validate(toolsSchema, body)
    const settingsColl = await settings()
    await settingsColl.updateOne({ _id: 'tools' as any }, { $set: { tools: newTools } }, { upsert: true })
    await touch()
    return NextResponse.json({ tools: newTools })
  } catch (err) {
    return handleApiError(err)
  }
}
