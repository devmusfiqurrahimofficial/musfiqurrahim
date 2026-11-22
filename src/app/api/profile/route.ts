import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { settings, touch } from '@/lib/db'
import { handleApiError } from '@/lib/apiHelper'
import { profileSchema } from '@/lib/schemas'
import { validate } from '@/lib/validation'
import type { Profile } from '@/types/models'

const EMPTY_PROFILE: Profile = { name: '', bio: [], stats: [], socials: {} }

export async function GET() {
  try {
    const settingsColl = await settings()
    const doc = await settingsColl.findOne({ _id: 'profile' as any })
    const { _id: _pId, ...profileData } = (doc as any) || {}
    return NextResponse.json({ ...EMPTY_PROFILE, ...profileData })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: Request) {
  try {
    await requireAuth(req)
    const body = await req.json().catch(() => ({}))
    const profile = validate(profileSchema, body)
    const settingsColl = await settings()
    await settingsColl.replaceOne({ _id: 'profile' as any }, profile as any, { upsert: true })
    await touch()
    return NextResponse.json(profile)
  } catch (err) {
    return handleApiError(err)
  }
}
