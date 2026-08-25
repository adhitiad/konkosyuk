import { NextRequest, NextResponse } from "next/server";
import { logApiRequest, logError } from "@/lib/logger";

interface AuthenticatedRequest extends NextRequest {
  user?: { id?: string };
}

export async function withRequestLogging(
  req: NextRequest,
  handler: (req: NextRequest, requestId: string) => Promise<NextResponse>,
) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const startTime = Date.now();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const response = await handler(req, requestId);
    const duration = Date.now() - startTime;
    const userId = (req as AuthenticatedRequest).user?.id;

    logApiRequest(
      req.method,
      req.nextUrl.pathname,
      response.status,
      duration,
      userId,
      requestId,
    );

    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    const userId = (req as AuthenticatedRequest).user?.id;

    logApiRequest(
      req.method,
      req.nextUrl.pathname,
      500,
      duration,
      userId,
      requestId,
    );
    logError(error, `${req.method} ${req.nextUrl.pathname}`, {
      requestId,
      ip,
      userAgent,
      route: req.nextUrl.pathname,
      method: req.method,
      userId,
    });
    throw error;
  }
}
