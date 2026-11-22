import { skills } from '@/lib/db'
import { createCollectionItem, getCollectionList, handleApiError } from '@/lib/apiHelper'
import { skillGroupSchema } from '@/lib/schemas'

export async function GET() {
  try {
    return await getCollectionList(skills)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: Request) {
  try {
    return await createCollectionItem(skills, skillGroupSchema, req)
  } catch (err) {
    return handleApiError(err)
  }
}
