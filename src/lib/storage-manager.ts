import { env } from '@/lib/env'
import { uploadToCloudinary } from '@/lib/cloudinary'

type StorageProvider = 'uploadthing' | 'cloudinary'

export interface UploadResult {
  url: string
  provider: StorageProvider
}

function getUploadthingFieldName(type: 'avatar' | 'property'): string {
  return type === 'avatar' ? 'avatarUploader' : 'propertyImageUploader'
}

export async function uploadFile(file: File, type: 'avatar' | 'property'): Promise<UploadResult> {
  const primary = env.STORAGE_PRIMARY ?? 'uploadthing'

  if (primary === 'cloudinary') {
    const buffer = Buffer.from(await file.arrayBuffer())
    const folder = type === 'avatar' ? 'konkosyuk/avatars' : 'konkosyuk/properties'
    const { secure_url } = await uploadToCloudinary(buffer, folder)
    return { url: secure_url, provider: 'cloudinary' }
  }

  try {
    const formData = new FormData()
    formData.append(getUploadthingFieldName(type), file)

    const res = await fetch('/api/uploadthing', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Upload failed')
    }

    const json = await res.json()
    return { url: json.url, provider: json.provider ?? 'uploadthing' }
  } catch (error) {
    if (primary === 'uploadthing') {
      console.warn('Uploadthing failed, falling back to Cloudinary:', error)

      const buffer = Buffer.from(await file.arrayBuffer())
      const folder = type === 'avatar' ? 'konkosyuk/avatars' : 'konkosyuk/properties'
      const { secure_url } = await uploadToCloudinary(buffer, folder)
      return { url: secure_url, provider: 'cloudinary' }
    }

    throw error
  }
}
