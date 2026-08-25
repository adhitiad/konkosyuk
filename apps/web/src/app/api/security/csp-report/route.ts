import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const report = await req.json();
    const violation = report["csp-report"] || report;

    logSecurityEvent("csp_violation", {
      blockedUri: violation["blocked-uri"],
      violatedDirective: violation["violated-directive"],
      originalPolicy: violation["original-policy"],
      documentUri: violation["document-uri"],
      referrer: violation["referrer"],
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }
}
