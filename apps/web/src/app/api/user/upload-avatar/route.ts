import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { logSecurityEvent } from "@/lib/logger";
import { ok, fail, handleApiError } from "@/lib/api";
import { withRateLimit } from "@/lib/rate-limit";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const magic = MAGIC_BYTES[mimeType];
  if (!magic) return false;
  return magic.every((byte, index) => buffer[index] === byte);
}

const avatarUploadRateLimit = {
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: "rl:avatar-upload",
};

async function avatarUploadHandler(req: NextRequest): Promise<Response> {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;

    const session = await requireSession();
    if (!session) {
      return fail("Unauthorized", 401, "UNAUTHORIZED");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return fail("No file provided", 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return fail("Tipe file tidak diizinkan", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return fail("Ukuran file maksimal 5MB", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      logSecurityEvent("avatar_upload_invalid_magic_bytes", {
        userId: session.user.id,
        mimeType: file.type,
      });
      return fail("File tidak valid", 400);
    }

    const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
    await mkdir(uploadDir, { recursive: true });

    const ext = MIME_TO_EXT[file.type] || "jpg";
    const filename = `${session.user.id}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const host =
      req.headers.get("host") || "localhost:3001" || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const publicUrl = `${protocol}://${host}/uploads/avatars/${filename}`;
    return ok({ url: publicUrl });
  } catch (error) {
    return handleApiError(error, "POST /api/user/upload-avatar");
  }
}

export async function POST(req: NextRequest) {
  return withRateLimit(avatarUploadRateLimit, req, avatarUploadHandler);
}
