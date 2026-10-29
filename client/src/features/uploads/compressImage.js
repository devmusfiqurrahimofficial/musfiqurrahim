export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_UPLOAD_MB = 10 // matches MAX_SIZE in server/src/routes/profileImage.js

// up to 4K on the long side, so it's still sharp wherever it ends up
const MAX_SIDE = 3840
const QUALITY = 0.92

// GIFs are skipped: a canvas only keeps the first frame.
export async function compressImage(file) {
  if (file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY))
  // browsers without a WebP encoder hand back a PNG instead; keep the original unless we actually saved bytes
  if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
}
