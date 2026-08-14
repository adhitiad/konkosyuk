import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const existing = req.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1];
  const token =
    existing ||
    `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
  const response = NextResponse.json({ success: true });

  if (!existing) {
    response.cookies.set("csrf_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  }

  return response;
}
