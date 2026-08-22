import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "@/db";
import { adPackages } from "@/db/schema";
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

const packages = [
  { name: "reguler_3d", label: "Reguler 3 Hari", tier: "reguler" as const, duration: 3, price: "34900", positionType: "rotation" as const, sortOrder: 1 },
  { name: "reguler_7d", label: "Reguler 1 Minggu", tier: "reguler" as const, duration: 7, price: "59900", positionType: "rotation" as const, sortOrder: 2 },
  { name: "reguler_30d", label: "Reguler 30 Hari", tier: "reguler" as const, duration: 30, price: "124900", positionType: "rotation" as const, sortOrder: 3 },
  { name: "reguler_90d", label: "Reguler 3 Bulan", tier: "reguler" as const, duration: 90, price: "274900", positionType: "rotation" as const, sortOrder: 4 },
  { name: "utama_3d", label: "Utama 3 Hari", tier: "utama" as const, duration: 3, price: "89900", positionType: "fixed_2" as const, sortOrder: 1 },
  { name: "utama_7d", label: "Utama 1 Minggu", tier: "utama" as const, duration: 7, price: "149900", positionType: "fixed_2" as const, sortOrder: 2 },
  { name: "utama_30d", label: "Utama 30 Hari", tier: "utama" as const, duration: 30, price: "349900", positionType: "fixed_2" as const, sortOrder: 3 },
  { name: "premium_3d", label: "Premium 3 Hari", tier: "premium" as const, duration: 3, price: "174900", positionType: "fixed_1" as const, sortOrder: 1 },
  { name: "premium_7d", label: "Premium 1 Minggu", tier: "premium" as const, duration: 7, price: "274900", positionType: "fixed_1" as const, sortOrder: 2 },
  { name: "premium_30d", label: "Premium 30 Hari", tier: "premium" as const, duration: 30, price: "549900", positionType: "fixed_1" as const, sortOrder: 3 },
];

async function seed() {
  console.log("Seeding ad packages...");
  for (const pkg of packages) {
    const [existing] = await db.select().from(adPackages).where(eq(adPackages.name, pkg.name)).limit(1);
    if (existing) {
      console.log(`  Skipping ${pkg.name} (already exists)`);
      continue;
    }
    await db.insert(adPackages).values(pkg);
    console.log(`  Created ${pkg.name}`);
  }
  console.log("Done seeding ad packages.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
