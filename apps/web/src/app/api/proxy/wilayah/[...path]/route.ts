import { NextRequest } from "next/server";
import { fail, handleApiError } from "@/lib/api";

const WILAYAH_API_BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    const targetUrl = `${WILAYAH_API_BASE}/${pathSegments.join("/")}${req.nextUrl.search}`;

    const response = await fetch(targetUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return fail(
        `Upstream API responded with ${response.status}`,
        response.status,
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return handleApiError(error, "GET /api/proxy/wilayah");
  }
}
