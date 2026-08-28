import { NextRequest } from "next/server";
import { generateReceiptPdf } from "@/actions/payments";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(
  __req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["cust", "owner", "admin", "staff"]);
    const { id } = await params;

    const pdfBlob = await generateReceiptPdf(id);

    if (!pdfBlob) {
      return new Response("Payment not found", { status: 404 });
    }

    const buffer = Buffer.from(await pdfBlob.arrayBuffer());

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/payments/[id]/receipt");
  }
}
