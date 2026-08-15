"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadFile } from "@/lib/storage-manager";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

const magicBytes: Record<string, number[][]> = {
  "image/jpeg": [
    [0xff, 0xd8, 0xff],
  ],
  "image/png": [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  ],
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46],
  ],
};

async function validateImageSignature(file: File): Promise<boolean> {
  const slice = file.slice(0, 12);
  const buffer = Buffer.from(await slice.arrayBuffer());
  const detectedType = Object.entries(magicBytes).find(([, signatures]) =>
    signatures.some((sig) => {
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) return false;
      }
      return true;
    }),
  )?.[0];

  return detectedType === file.type;
}

export type UploadImageState = {
  success?: boolean;
  error?: string;
  data?: {
    url: string;
    provider: string;
  };
};

export async function uploadImageAction(
  prevState: UploadImageState | undefined,
  formData: FormData,
): Promise<UploadImageState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const file = formData.get("file") as File | null;
    const requestedType = formData.get("type");
    const type = (requestedType || "avatar") as
      | "avatar"
      | "property"
      | "ktp"
      | "report";

    if (!file) {
      return { error: "File tidak ditemukan", success: false };
    }

    if (!allowedTypes.has(file.type)) {
      return { error: "File harus berupa gambar (JPG, PNG, WebP)", success: false };
    }

    if (file.size > maxFileSize) {
      return { error: "Ukuran file maksimal 5MB", success: false };
    }

    if (!["avatar", "property", "ktp", "report"].includes(type)) {
      return { error: "Tipe upload tidak valid", success: false };
    }

    if (type === "ktp" && session.user.role !== "owner") {
      return { error: "Hanya owner yang dapat mengunggah KTP", success: false };
    }

    if (type === "property" && session.user.role !== "owner") {
      return { error: "Hanya owner yang dapat mengunggah properti", success: false };
    }

    const isValidSignature = await validateImageSignature(file);
    if (!isValidSignature) {
      return { error: "File tidak valid atau tidak sesuai format gambar", success: false };
    }

    const result = await uploadFile(file, type);

    return {
      success: true,
      data: {
        url: result.url,
        provider: result.provider,
      },
    };
  } catch (error) {
    console.error("uploadImageAction error:", error);
    return { error: "Gagal mengunggah gambar", success: false };
  }
}
