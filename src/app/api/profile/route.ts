import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { settings, touch } from '@/lib/db'
import { handleApiError } from '@/lib/apiHelper'
import { profileSchema } from '@/lib/schemas'
import { normalizeProfileUrls } from '@/lib/uploadUrl'
import { validate } from '@/lib/validation'
import { profile as defaultProfile } from '@/data'
import type { Profile } from '@/types/models'

export async function GET() {
  try {
    const settingsColl = await settings()
    const doc = await settingsColl.findOne({ _id: 'profile' as any })
    if (!doc) {
      return NextResponse.json(defaultProfile)
    }
    const { _id: _pId, ...profileData } = (doc as any) || {}
    const profile: Profile = { ...defaultProfile, ...profileData }
    return NextResponse.json(normalizeProfileUrls(profile))
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
