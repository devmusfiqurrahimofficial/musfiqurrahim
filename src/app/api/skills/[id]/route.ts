import { skills } from '@/lib/db'
import {
  deleteCollectionItem,
  getCollectionItem,
  handleApiError,
  patchCollectionItem,
  updateCollectionItem,
} from '@/lib/apiHelper'
import { skillGroupSchema } from '@/lib/schemas'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    return await getCollectionItem(skills, id)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    return await updateCollectionItem(skills, skillGroupSchema, id, req)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    return await patchCollectionItem(skills, skillGroupSchema, id, req)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    return await deleteCollectionItem(skills, id, req)
  } catch (err) {
    return handleApiError(err)
  }
}
