import { NextRequest } from "next/server";
import { processExpiredPaymentRefunds } from "@/actions/cron/process-expired-refunds";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const result = await processExpiredPaymentRefunds();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cron refund error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
