import { env } from '@/lib/env'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { apiClient } from '@/lib/axios'

type StorageProvider = 'uploadthing' | 'cloudinary'

export interface UploadResult {
  url: string
  provider: StorageProvider
}

function getUploadthingFieldName(type: 'avatar' | 'property' | 'ktp' | 'report'): string {
  return type === 'avatar' ? 'avatarUploader' : type === 'property' || type === 'report' ? 'propertyImageUploader' : 'ktpUploader'
}

export async function uploadFile(file: File, type: 'avatar' | 'property' | 'ktp' | 'report'): Promise<UploadResult> {
  const primary = env.STORAGE_PRIMARY ?? 'uploadthing'

  if (primary === 'cloudinary') {
    const buffer = Buffer.from(await file.arrayBuffer())
      const folder = type === 'avatar'
        ? 'konkosyuk/avatars'
        : type === 'property'
          ? 'konkosyuk/properties'
          : type === 'ktp'
            ? 'konkosyuk/ktp'
            : 'konkosyuk/reports'
    const { secure_url } = await uploadToCloudinary(buffer, folder)
    return { url: secure_url, provider: 'cloudinary' }
  }

  try {
    const formData = new FormData()
    formData.append(getUploadthingFieldName(type), file)

    const { data: json } = await apiClient.post('/api/uploadthing', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return { url: json.url, provider: json.provider ?? 'uploadthing' }
  } catch (error) {
    if (primary === 'uploadthing') {
      console.warn('Uploadthing failed, falling back to Cloudinary:', error)

      const buffer = Buffer.from(await file.arrayBuffer())
      const folder = type === 'avatar'
        ? 'konkosyuk/avatars'
        : type === 'report'
          ? 'konkosyuk/reports'
          : type === 'ktp'
            ? 'konkosyuk/ktp'
            : 'konkosyuk/properties'
      const { secure_url } = await uploadToCloudinary(buffer, folder)
      return { url: secure_url, provider: 'cloudinary' }
    }

    throw error
  }
}
