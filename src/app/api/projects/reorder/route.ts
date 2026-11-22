import { projects } from '@/lib/db'
import { handleApiError, reorderCollection } from '@/lib/apiHelper'

export async function POST(req: Request) {
  try {
    return await reorderCollection(projects, req)
  } catch (err) {
    return handleApiError(err)
  }
}
