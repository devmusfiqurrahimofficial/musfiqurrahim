import { skills } from '@/lib/db'
import { handleApiError, reorderCollection } from '@/lib/apiHelper'

export async function POST(req: Request) {
  try {
    return await reorderCollection(skills, req)
  } catch (err) {
    return handleApiError(err)
  }
}
