import { projects } from '@/lib/db'
import { createCollectionItem, getCollectionList, handleApiError } from '@/lib/apiHelper'
import { projectSchema } from '@/lib/schemas'

export async function GET() {
  try {
    return await getCollectionList(projects)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: Request) {
  try {
    return await createCollectionItem(projects, projectSchema, req)
  } catch (err) {
    return handleApiError(err)
  }
}
