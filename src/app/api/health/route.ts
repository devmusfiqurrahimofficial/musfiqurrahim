import { NextResponse } from 'next/server'
import { pingDb } from '@/lib/db'
import { handleApiError } from '@/lib/apiHelper'

export async function GET() {
  try {
    await pingDb()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
