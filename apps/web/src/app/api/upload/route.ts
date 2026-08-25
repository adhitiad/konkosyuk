import { NextRequest } from "next/server";
import { uploadFile } from "@/lib/storage-manager";
import { requireSession } from "@/lib/auth";
import { handleApiError, fail, ok } from "@/lib/api";
import { validateMutationCsrf } from "@/lib/api-auth";
import { withRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/logger";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const magic = MAGIC_BYTES[mimeType];
  if (!magic) return false;
  return magic.every((byte, index) => buffer[index] === byte);
}

const uploadRateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: "rl:upload",
};

async function uploadHandler(req: NextRequest): Promise<Response> {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedType = formData.get("type");
    const type = (requestedType || "avatar") as
      "avatar" | "property" | "ktp" | "report";

    if (!file) {
      return fail("No file provided", 400);
    }

    if (!allowedTypes.has(file.type)) {
      return fail("File harus berupa gambar", 400);
    }
    if (file.size > maxFileSize) {
      return fail("Ukuran file maksimal 5MB", 400);
    }
    if (!["avatar", "property", "ktp", "report"].includes(type)) {
      return fail("Tipe upload tidak valid", 400);
    }
    if (type === "ktp" && session.user.role !== "owner") {
      return fail("Hanya owner yang dapat mengunggah KTP", 403, "FORBIDDEN");
    }
    if (type === "property" && session.user.role !== "owner") {
      return fail("Hanya owner yang dapat mengunggah properti", 403, "FORBIDDEN");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      logSecurityEvent("upload_invalid_magic_bytes", {
        userId: session.user.id,
        mimeType: file.type,
      });
      return fail("File tidak valid", 400);
    }

    const result = await uploadFile(file, type);

    return ok({ url: result.url, provider: result.provider });
  } catch (error) {
    return handleApiError(error, "POST /api/upload");
  }
}

export async function POST(req: NextRequest) {
  return withRateLimit(uploadRateLimitConfig, req, uploadHandler);
}
