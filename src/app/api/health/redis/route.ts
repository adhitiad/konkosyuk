import { redisHealth } from "@/lib/redis";
import { ok, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    return ok(await redisHealth());
  } catch (error) {
    return handleApiError(error, "GET /api/health/redis");
  }
}
