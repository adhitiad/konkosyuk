import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "@/db";
import { popularAreas } from "@/db/schema";
import { eq } from "drizzle-orm";

// M-3 fix: Graceful shutdown untuk seed script.
let isShuttingDown = false;

process.on("SIGINT", () => {
  if (isShuttingDown) {
    process.exit(1);
  }
  isShuttingDown = true;
  console.error("\nSeed dihentikan oleh user. Data mungkin tidak lengkap.");
  process.exit(130);
});

process.on("SIGTERM", () => {
  if (isShuttingDown) {
    process.exit(1);
  }
  isShuttingDown = true;
  console.error("\nSeed dihentikan oleh sistem. Data mungkin tidak lengkap.");
  process.exit(143);
});

const areas = [
  {
    slug: "yogyakarta",
    name: "Kos Yogyakarta",
    imageKey: "konkosyuk/areas/yogyakarta",
    sortOrder: 1,
  },
  {
    slug: "jakarta-selatan",
    name: "Kos Jakarta Selatan",
    imageKey: "konkosyuk/areas/jakarta-selatan",
    sortOrder: 2,
  },
  {
    slug: "jakarta-barat",
    name: "Kos Jakarta Barat",
    imageKey: "konkosyuk/areas/jakarta-barat",
    sortOrder: 3,
  },
  {
    slug: "jakarta-timur",
    name: "Kos Jakarta Timur",
    imageKey: "konkosyuk/areas/jakarta-timur",
    sortOrder: 4,
  },
  {
    slug: "bandung",
    name: "Kos Bandung",
    imageKey: "konkosyuk/areas/bandung",
    sortOrder: 5,
  },
  {
    slug: "surabaya",
    name: "Kos Surabaya",
    imageKey: "konkosyuk/areas/surabaya",
    sortOrder: 6,
  },
  {
    slug: "malang",
    name: "Kos Malang",
    imageKey: "konkosyuk/areas/malang",
    sortOrder: 7,
  },
  {
    slug: "semarang",
    name: "Kos Semarang",
    imageKey: "konkosyuk/areas/semarang",
    sortOrder: 8,
  },
  {
    slug: "depok",
    name: "Kos Depok",
    imageKey: "konkosyuk/areas/depok",
    sortOrder: 9,
  },
  {
    slug: "bogor",
    name: "Kos Bogor",
    imageKey: "konkosyuk/areas/bogor",
    sortOrder: 10,
  },
  {
    slug: "medan",
    name: "Kos Medan",
    imageKey: "konkosyuk/areas/medan",
    sortOrder: 11,
  },
  {
    slug: "makassar",
    name: "Kos Makassar",
    imageKey: "konkosyuk/areas/makassar",
    sortOrder: 12,
  },
];

async function seed() {
  console.log("Seeding popular areas...");
  for (const area of areas) {
    const [existing] = await db
      .select()
      .from(popularAreas)
      .where(eq(popularAreas.slug, area.slug))
      .limit(1);
    if (existing) {
      console.log(`  Skipping ${area.slug} (already exists)`);
      continue;
    }
    await db.insert(popularAreas).values(area);
    console.log(`  Created ${area.slug}`);
  }
  console.log("Done seeding popular areas.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
