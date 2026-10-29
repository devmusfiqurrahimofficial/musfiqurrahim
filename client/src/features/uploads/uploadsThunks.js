// Resolves to the uploaded image's URL. Failures become toasts via notify: true.
import { createAsyncThunk } from '@reduxjs/toolkit'
import { errorMessage } from '../api/apiErrors.js'
import { IMAGE_TYPES, MAX_UPLOAD_MB, compressImage } from './compressImage.js'
import { uploadsApi } from './uploadsApi.js'

const fail = (message) => ({ message, notify: true })

export const uploadImage = createAsyncThunk('uploads/uploadImage', async (file, { dispatch, rejectWithValue }) => {
  if (!IMAGE_TYPES.includes(file.type)) return rejectWithValue(fail('Only JPG, PNG, WEBP and GIF images are allowed.'))
  // generous here because it gets compressed; the server's 10 MB limit is checked after
  if (file.size > 50 * 1024 * 1024) return rejectWithValue(fail('Image must be under 50 MB.'))

  const upload = await compressImage(file)
  if (upload.size > MAX_UPLOAD_MB * 1024 * 1024) return rejectWithValue(fail(`Image must be under ${MAX_UPLOAD_MB} MB after compression.`))

  const formData = new FormData()
  formData.append('image', upload)
  const result = await dispatch(uploadsApi.endpoints.uploadFile.initiate(formData))
  if (result.error) return rejectWithValue(fail(errorMessage(result.error)))
  return result.data.url
})
