import { v2 as cloudinary } from "cloudinary";

export interface UploadResult {
  url: string;
  provider: "cloudinary";
}

function ensureConfigured() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folderName: string,
): Promise<{ secure_url: string }> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({ secure_url: result.secure_url });
        } else {
          reject(new Error("Cloudinary upload failed"));
        }
      },
    );

    uploadStream.end(fileBuffer);
  });
}

export async function checkCloudinaryConnection(): Promise<void> {
  ensureConfigured();
  await cloudinary.api.ping();
}

export function getCloudinaryUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  },
): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    return `https://res.cloudinary.com/placeholder/image/upload/${publicId}`;
  }
  let url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
  const params: string[] = [];
  if (options?.width) params.push(`w_${options.width}`);
  if (options?.height) params.push(`h_${options.height}`);
  if (options?.quality) params.push(`q_${options.quality}`);
  if (params.length > 0) url += `?${params.join(",")}`;
  return url;
}
