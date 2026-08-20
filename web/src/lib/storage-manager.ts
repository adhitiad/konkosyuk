import { uploadToCloudinary } from "@/lib/cloudinary";

export interface UploadResult {
  url: string;
  provider: "cloudinary";
}

export async function uploadFile(
  file: File,
  type: "avatar" | "property" | "ktp" | "report" | "inspection",
): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const folder =
    type === "avatar"
      ? "konkosyuk/avatars"
      : type === "property"
        ? "konkosyuk/properties"
        : type === "ktp"
          ? "konkosyuk/ktp"
          : type === "inspection"
            ? "konkosyuk/inspections"
            : "konkosyuk/reports";
  const { secure_url } = await uploadToCloudinary(buffer, folder);
  return { url: secure_url, provider: "cloudinary" };
}
