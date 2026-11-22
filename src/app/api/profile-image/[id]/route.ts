import { handleApiError } from '@/lib/apiHelper'
import { getUploadedImageResponse } from '@/lib/uploadHelper'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    return await getUploadedImageResponse(id)
  } catch (err) {
    return handleApiError(err)
  }
}
