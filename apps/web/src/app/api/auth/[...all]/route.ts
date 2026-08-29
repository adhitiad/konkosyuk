import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { authRateLimit, enforceRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

console.log("[DEBUG] Auth route module loaded");

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(req: NextRequest) {
  console.log("[DEBUG] POST request received:", req.url);
  const limited = await enforceRateLimit(req, authRateLimit);
  if (limited) return limited;

  // Debug: log the request body for sign-in attempts
  const url = new URL(req.url);
  if (url.pathname.includes("sign-in/email")) {
    try {
      const clone = req.clone();
      const body = await clone.json();
      console.log("[DEBUG] Sign-in attempt:", { email: body.email, hasPassword: !!body.password });
    } catch { /* ignore */ }
  }

  const result = await handler.POST(req);
  
  // Create a new response with the debug header
  const response = new NextResponse(result.body, {
    status: result.status,
    headers: result.headers,
  });
  response.headers.set("x-debug-route", "auth-route-handler");
  return response;
}
