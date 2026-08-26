import { db } from "@/db";
import { properties, bookings, bookingRequests } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }

    const ownerId = session.user.id;

    const ownerProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, ownerId));

    const propertyIds = ownerProperties.map((p) => p.id);

    const [propertyStats, inquiryStats, bookingStats, rankingTips] =
      await Promise.all([
        getPropertyStats(ownerId),
        getInquiryStats(propertyIds),
        getBookingStats(propertyIds),
        getRankingTips(
          ownerProperties.map((p) => ({
            id: p.id,
            name: p.name,
            images: p.images,
            description: p.description,
            amenities: p.amenities ?? [],
            gpsVerified: p.gpsVerified,
            isFeatured: p.isFeatured,
          })),
        ),
      ]);

    return ok({
      data: {
        propertyStats,
        inquiryStats,
        bookingStats,
        rankingTips,
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/owner/insights");
  }
}

async function getPropertyStats(ownerId: string) {
  const ownerProperties = await db
    .select()
    .from(properties)
    .where(eq(properties.ownerId, ownerId));

  const total = ownerProperties.length;
  const active = ownerProperties.filter((p) => p.isActive).length;
  const withImages = ownerProperties.filter((p) => (p.images?.length || 0) >= 5).length;
  const gpsVerified = ownerProperties.filter((p) => p.gpsVerified).length;
  const featured = ownerProperties.filter((p) => p.isFeatured).length;

  return {
    total,
    active,
    withImages,
    gpsVerified,
    featured,
    completionRate: total > 0 ? Math.round((withImages / total) * 100) : 0,
  };
}

async function getInquiryStats(propertyIds: string[]) {
  const inquiries = await db
    .select()
    .from(bookingRequests)
    .where(
      and(
        inArray(bookingRequests.propertyId, propertyIds),
        sql`${bookingRequests.createdAt} >= NOW() - INTERVAL '30 days'`,
      ),
    );

  const pending = inquiries.filter((i) => i.status === "pending").length;
  const approved = inquiries.filter((i) => i.status === "approved").length;
  const rejected = inquiries.filter((i) => i.status === "rejected").length;
  const paid = inquiries.filter((i) => i.status === "paid").length;

  return {
    total: inquiries.length,
    pending,
    approved,
    rejected,
    paid,
    responseRate:
      inquiries.length > 0
        ? Math.round(((approved + rejected) / inquiries.length) * 100)
        : 0,
  };
}

async function getBookingStats(propertyIds: string[]) {
  const bookingsList = await db
    .select()
    .from(bookings)
    .where(
      and(
        inArray(bookings.propertyId, propertyIds),
        sql`${bookings.createdAt} >= NOW() - INTERVAL '30 days'`,
      ),
    );

  const confirmed = bookingsList.filter((b) => b.status === "confirmed").length;
  const completed = bookingsList.filter((b) => b.status === "completed").length;
  const cancelled = bookingsList.filter((b) => b.status === "cancelled").length;

  return {
    total: bookingsList.length,
    confirmed,
    completed,
    cancelled,
    confirmationRate:
      bookingsList.length > 0
        ? Math.round(((confirmed + completed) / bookingsList.length) * 100)
        : 0,
  };
}

async function getRankingTips(
  ownerProperties: Array<{
    id: string;
    name: string;
    images: string[] | null;
    description: string | null;
    amenities: string[];
    gpsVerified: boolean;
    isFeatured: boolean | null;
  }>,
) {
  const tips: string[] = [];

  for (const property of ownerProperties) {
    if ((property.images?.length || 0) < 5) {
      tips.push(
        `"${property.name}": Tambah ${
          5 - (property.images?.length || 0)
        } foto lagi untuk meningkatkan visibilitas`,
      );
    }
    if ((property.description?.length || 0) < 200) {
      tips.push(
        `"${property.name}": Perpanjang deskripsi menjadi minimal 200 karakter`,
      );
    }
    if (!property.gpsVerified) {
      tips.push(
        `"${property.name}": Verifikasi lokasi GPS untuk naik 7 poin peringkat`,
      );
    }
    if (!property.isFeatured) {
      tips.push(
        `"${property.name}": Coba fitur "Featured Listing" untuk exposure 3x lipat`,
      );
    }
  }

  return tips.slice(0, 5);
}
