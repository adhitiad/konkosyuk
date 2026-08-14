export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  onProgress?: (progress: number) => void;
}

export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    useWebWorker = true,
    onProgress,
  } = options;

  try {
    const imageCompression = (await import("browser-image-compression"))
      .default;

    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      onProgress,
    });

    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    return file;
  }
}

export function getOptimalImageFormat(file: File): string {
  const type = file.type.toLowerCase();

  if (type.includes("avif")) return "image/avif";
  if (type.includes("webp")) return "image/webp";
  if (type.includes("png")) return "image/png";
  if (type.includes("jpeg") || type.includes("jpg")) return "image/jpeg";

  return "image/webp";
}

export function validateImageFile(file: File, maxSizeMB: number = 5): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const isValidType = validTypes.includes(file.type);
  const isValidSize = file.size <= maxSizeMB * 1024 * 1024;

  return isValidType && isValidSize;
}
