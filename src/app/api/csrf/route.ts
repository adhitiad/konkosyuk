import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const token = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
  const response = NextResponse.json({ success: true });

  response.cookies.set("csrf_token", token, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}
