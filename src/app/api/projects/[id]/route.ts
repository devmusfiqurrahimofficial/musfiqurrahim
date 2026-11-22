import { projects } from '@/lib/db'
import {
  deleteCollectionItem,
  getCollectionItem,
  handleApiError,
  patchCollectionItem,
  updateCollectionItem,
} from '@/lib/apiHelper'
import { projectSchema } from '@/lib/schemas'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    return await getCollectionItem(projects, id)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    return await updateCollectionItem(projects, projectSchema, id, req)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    return await patchCollectionItem(projects, projectSchema, id, req)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    return await deleteCollectionItem(projects, id, req)
  } catch (err) {
    return handleApiError(err)
  }
}
