import { commands } from '@/lib/db'
import { handleApiError, reorderCollection } from '@/lib/apiHelper'

export async function POST(req: Request) {
  try {
    return await reorderCollection(commands, req)
  } catch (err) {
    return handleApiError(err)
  }
}
