import { createAsyncThunk } from '@reduxjs/toolkit'
import { errorMessage } from '../api/apiErrors'
import { IMAGE_TYPES, MAX_UPLOAD_MB, compressImage } from './compressImage'
import { uploadsApi } from './uploadsApi'

const fail = (message: string) => ({ message, notify: true })

export const uploadImage = createAsyncThunk<string, File>('uploads/uploadImage', async (file, { dispatch, rejectWithValue }) => {
  if (!IMAGE_TYPES.includes(file.type)) return rejectWithValue(fail('Only JPG, PNG, WEBP and GIF images are allowed.'))
  if (file.size > 50 * 1024 * 1024) return rejectWithValue(fail('Image must be under 50 MB.'))

  const upload = await compressImage(file)
  if (upload.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return rejectWithValue(fail(`Image must be under ${MAX_UPLOAD_MB} MB after compression.`))
  }

  const formData = new FormData()
  formData.append('image', upload)
  const result = await dispatch(uploadsApi.endpoints.uploadFile.initiate(formData))
  if (result.error) return rejectWithValue(fail(errorMessage(result.error)))
  return (result.data as { url: string }).url
})

export const uploadResume = createAsyncThunk<string, File>('uploads/uploadResume', async (file, { dispatch, rejectWithValue }) => {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return rejectWithValue(fail('Only PDF documents are allowed for resume.'))
  if (file.size > 15 * 1024 * 1024) return rejectWithValue(fail('Resume must be under 15 MB.'))

  const formData = new FormData()
  formData.append('file', file)
  const result = await dispatch(uploadsApi.endpoints.uploadFile.initiate(formData))
  if (result.error) return rejectWithValue(fail(errorMessage(result.error)))
  return (result.data as { url: string }).url
})
