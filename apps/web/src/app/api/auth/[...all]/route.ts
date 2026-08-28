import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { authRateLimit, enforceRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, authRateLimit);
  if (limited) return limited;
  return handler.POST(req);
}
