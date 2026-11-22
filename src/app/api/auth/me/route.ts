import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/apiHelper'

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req)
    return NextResponse.json({ user })
  } catch (err) {
    return handleApiError(err)
  }
}
