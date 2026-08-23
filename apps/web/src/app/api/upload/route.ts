import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage-manager";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { validateMutationCsrf } from "@/lib/api-auth";
import { withRateLimit } from "@/lib/rate-limit";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        { error: "File harus berupa gambar" },
        { status: 400 },
      );
    }
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5MB" },
        { status: 400 },
      );
    }
    if (!["avatar", "property", "ktp", "report"].includes(type)) {
      return NextResponse.json(
        { error: "Tipe upload tidak valid" },
        { status: 400 },
      );
    }
    if (type === "ktp" && session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Hanya owner yang dapat mengunggah KTP" },
        { status: 403 },
      );
    }
    if (type === "property" && session.user.role !== "owner") {
      return NextResponse.json(
        { error: "Hanya owner yang dapat mengunggah properti" },
        { status: 403 },
      );
    }

    const result = await uploadFile(file, type);

    return NextResponse.json({ url: result.url, provider: result.provider });
  } catch (error) {
    return handleApiError(error, "POST /api/upload");
  }
}

export async function POST(req: NextRequest) {
  return withRateLimit(uploadRateLimitConfig, req, uploadHandler);
}
