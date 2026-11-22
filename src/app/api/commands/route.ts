import { commands } from '@/lib/db'
import { createCollectionItem, getCollectionList, handleApiError } from '@/lib/apiHelper'
import { commandSchema } from '@/lib/schemas'

export async function GET() {
  try {
    return await getCollectionList(commands)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: Request) {
  try {
    return await createCollectionItem(commands, commandSchema, req)
  } catch (err) {
    return handleApiError(err)
  }
}
