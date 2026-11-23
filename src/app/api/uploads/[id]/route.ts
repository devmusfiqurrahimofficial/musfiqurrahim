import { handleApiError } from '@/lib/apiHelper'
import { getUploadedImageResponse } from '@/lib/uploadHelper'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const download = new URL(req.url).searchParams.get('download') === '1'
    return await getUploadedImageResponse(id, { download })
  } catch (err) {
    return handleApiError(err)
  }
}
