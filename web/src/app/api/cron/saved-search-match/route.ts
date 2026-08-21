import { NextRequest } from "next/server";
import { matchAndNotifySavedSearches } from "@/lib/cron/saved-search-matcher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const result = await matchAndNotifySavedSearches();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cron saved-search error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
