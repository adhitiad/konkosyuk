import { v2 as cloudinary } from 'cloudinary'
import { env } from '@/lib/env'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folderName: string,
): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({ secure_url: result.secure_url })
        } else {
          reject(new Error('Cloudinary upload failed'))
        }
      },
    )

    uploadStream.end(fileBuffer)
  })
}
