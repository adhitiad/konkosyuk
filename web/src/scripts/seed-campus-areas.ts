import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "@/db";
import { campusAreas } from "@/db/schema";
import { eq } from "drizzle-orm";

const areas = [
  { slug: "ugm-jogja", name: "UGM Jogja", imageKey: "konkosyuk/campus/ugm", sortOrder: 1 },
  { slug: "undip-semarang", name: "UNDIP Semarang", imageKey: "konkosyuk/campus/undip", sortOrder: 2 },
  { slug: "ui-depok", name: "UI Depok", imageKey: "konkosyuk/campus/ui", sortOrder: 3 },
  { slug: "unpad-jatinangor", name: "UNPAD Jatinangor", imageKey: "konkosyuk/campus/unpad", sortOrder: 4 },
  { slug: "itb-bandung", name: "ITB Bandung", imageKey: "konkosyuk/campus/itb", sortOrder: 5 },
  { slug: "ub-jakarta", name: "UB Jakarta", imageKey: "konkosyuk/campus/ub", sortOrder: 6 },
  { slug: "uai-yogyakarta", name: "UAI Yogyakarta", imageKey: "konkosyuk/campus/uai", sortOrder: 7 },
  { slug: "unair-surabaya", name: "UNAIR Surabaya", imageKey: "konkosyuk/campus/unair", sortOrder: 8 },
  { slug: "um-malang", name: "UM Malang", imageKey: "konkosyuk/campus/um", sortOrder: 9 },
  { slug: "usn-jakarta", name: "USN Jakarta", imageKey: "konkosyuk/campus/usn", sortOrder: 10 },
  { slug: "uin-malang", name: "UIN Malang", imageKey: "konkosyuk/campus/uin", sortOrder: 11 },
  { slug: "uin-suka", name: "UIN Sunan Kalijaga", imageKey: "konkosyuk/campus/uin-suka", sortOrder: 12 },
];

async function seed() {
  console.log("Seeding campus areas...");
  for (const area of areas) {
    const [existing] = await db.select().from(campusAreas).where(eq(campusAreas.slug, area.slug)).limit(1);
    if (existing) {
      console.log(`  Skipping ${area.slug} (already exists)`);
      continue;
    }
    await db.insert(campusAreas).values(area);
    console.log(`  Created ${area.slug}`);
  }
  console.log("Done seeding campus areas.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
