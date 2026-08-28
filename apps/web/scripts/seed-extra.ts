import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { hashPassword } from "@better-auth/utils/password";
import * as schema from "../src/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const db = drizzle(pool, { schema });

process.on("SIGINT", () => {
  console.error("\nSeed dihentikan oleh user.");
  process.exit(130);
});

process.on("SIGTERM", () => {
  console.error("\nSeed dihentikan oleh sistem.");
  process.exit(143);
});

async function seed() {
  const PASSWORD = {
    admin: await hashPassword("Admin123!"),
    staff: await hashPassword("Staff123!"),
    cust: await hashPassword("Cust123!"),
    owner: await hashPassword("Owner123!"),
  };

  const newUsers = [
    { email: "superadmin1@booking.com", name: "Super Admin Satu", role: "admin" as const },
    { email: "superadmin2@booking.com", name: "Super Admin Dua", role: "admin" as const },
    { email: "staff2@booking.com", name: "Staff Operasional 2", role: "staff" as const },
    { email: "staff3@booking.com", name: "Staff Operasional 3", role: "staff" as const },
    { email: "staff4@booking.com", name: "Staff Operasional 4", role: "staff" as const },
    { email: "staff5@booking.com", name: "Staff Operasional 5", role: "staff" as const },
    { email: "cust4@booking.com", name: "Andi Penyewa 4", role: "cust" as const },
    { email: "cust5@booking.com", name: "Rina Penyewa 5", role: "cust" as const },
    { email: "cust6@booking.com", name: "Joko Penyewa 6", role: "cust" as const },
    { email: "cust7@booking.com", name: "Sari Penyewa 7", role: "cust" as const },
    { email: "cust8@booking.com", name: "Budi Penyewa 8", role: "cust" as const },
    { email: "cust9@booking.com", name: "Dewi Penyewa 9", role: "cust" as const },
    { email: "owner3@booking.com", name: "Owner Kost Bandung", role: "owner" as const },
    { email: "owner4@booking.com", name: "Owner Kost Semarang", role: "owner" as const },
    { email: "owner5@booking.com", name: "Owner Kontrakan Bali", role: "owner" as const },
    { email: "owner6@booking.com", name: "Owner Kontrakan Medan", role: "owner" as const },
  ];

  const newAccounts = newUsers.map((user) => ({
    id: randomUUID(),
    userId: "" as string,
    accountId: user.email,
    providerId: "credential" as const,
    password:
      user.role === "admin"
        ? PASSWORD.admin
        : user.role === "staff"
          ? PASSWORD.staff
          : user.role === "owner"
            ? PASSWORD.owner
            : PASSWORD.cust,
  }));

  const propertiesData = [
    {
      name: "Kos Melati Senayan",
      description: "Kos nyaman di kawasan Senayan, Jakarta Selatan dengan fasilitas lengkap",
      address: "Jl. Senayan No. 88, Jakarta Selatan",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      district: "Senayan",
      type: "kost" as const,
      basePrice: "2500000",
      images: ["https://picsum.photos/200/300?random=1"],
      metadata: { gender: "putra", includeMeals: false, curfew: "23:00" },
      amenities: ["wifi", "ac", "kamar_mandi_dalam", "laundry"],
    },
    {
      name: "Kos Mawar Bandung",
      description: "Kos putri strategis dekat kampus di Bandung",
      address: "Jl. Mawar No. 12, Bandung",
      province: "Jawa Barat",
      city: "Bandung",
      district: "Cicadas",
      type: "kost" as const,
      basePrice: "1800000",
      images: ["https://picsum.photos/200/300?random=2"],
      metadata: { gender: "putri", includeMeals: true, curfew: "22:00" },
      amenities: ["wifi", "kamar_mandi_dalam", "dapur_umum"],
    },
    {
      name: "Kos Anggrek Semarang",
      description: "Kos mixed dengan akses mudah ke pusat kota Semarang",
      address: "Jl. Anggrek No. 45, Semarang",
      province: "Jawa Tengah",
      city: "Semarang",
      district: "Pemuda",
      type: "kost" as const,
      basePrice: "1600000",
      images: ["https://picsum.photos/200/300?random=3"],
      metadata: { gender: "mixed", includeMeals: false, curfew: "24:00" },
      amenities: ["wifi", "parkir_motor", "security"],
    },
    {
      name: "Kos Dahlia Yogyakarta",
      description: "Kos syariah dekat Malioboro Yogyakarta",
      address: "Jl. Dahlia No. 7, Yogyakarta",
      province: "DI Yogyakarta",
      city: "Yogyakarta",
      district: "Jetis",
      type: "kost" as const,
      basePrice: "1400000",
      images: ["https://picsum.photos/200/300?random=4"],
      metadata: { gender: "putra", includeMeals: true, curfew: "22:30" },
      amenities: ["wifi", "ac", "kamar_mandi_dalam", "musholla"],
    },
    {
      name: "Kos Kenanga Surabaya",
      description: "Kos eksklusif di kawasan Gunung Anyar Surabaya",
      address: "Jl. Kenanga No. 23, Surabaya",
      province: "Jawa Timur",
      city: "Surabaya",
      district: "Gunung Anyar",
      type: "kost" as const,
      basePrice: "2200000",
      images: ["https://picsum.photos/200/300?random=5"],
      metadata: { gender: "putri", includeMeals: true, curfew: "23:00" },
      amenities: ["wifi", "ac", "kamar_mandi_dalam", "laundry", "gym"],
    },
    {
      name: "Kos Cempaka Malang",
      description: "Kos budget friendly di sekitar Universitas Brawijaya",
      address: "Jl. Cempaka No. 56, Malang",
      province: "Jawa Timur",
      city: "Malang",
      district: "Lowokwaru",
      type: "kost" as const,
      basePrice: "1200000",
      images: ["https://picsum.photos/200/300?random=6"],
      metadata: { gender: "putra", includeMeals: false, curfew: "23:30" },
      amenities: ["wifi", "parkir_motor", "dapur_umum"],
    },
    {
      name: "Kontrakan Keluarga Bali",
      description: "Kontrakan rumah keluarga dengan taman di Denpasar Bali",
      address: "Jl. Keluarga No. 3, Denpasar",
      province: "Bali",
      city: "Denpasar",
      district: "Dangin Puri",
      type: "kontrakan" as const,
      basePrice: "3500000",
      images: ["https://picsum.photos/200/300?random=7"],
      metadata: { minContractMonths: 12, includeFurniture: true },
      amenities: ["wifi", "ac", "carport", "taman"],
    },
    {
      name: "Kontrakan Harmoni Medan",
      description: "Kontrakan rumah 2 lantai di Medan",
      address: "Jl. Harmoni No. 19, Medan",
      province: "Sumatera Utara",
      city: "Medan",
      district: "Polonia",
      type: "kontrakan" as const,
      basePrice: "2800000",
      images: ["https://picsum.photos/200/300?random=8"],
      metadata: { minContractMonths: 6, includeFurniture: false },
      amenities: ["wifi", "parkir_mobil", "security"],
    },
    {
      name: "Kontrakan Makassar Indah",
      description: "Kontrakan modern dekat pantai di Makassar",
      address: "Jl. Makassar Indah No. 8, Makassar",
      province: "Sulawesi Selatan",
      city: "Makassar",
      district: "Rappocini",
      type: "kontrakan" as const,
      basePrice: "3200000",
      images: ["https://picsum.photos/200/300?random=9"],
      metadata: { minContractMonths: 12, includeFurniture: true },
      amenities: ["wifi", "ac", "carport", "security", "kolam_renang"],
    },
    {
      name: "Kontrakan Samarinda Baru",
      description: "Kontrakan rumah baru di Samarinda, Kalimantan Timur",
      address: "Jl. Samarinda Baru No. 15, Samarinda",
      province: "Kalimantan Timur",
      city: "Samarinda",
      district: "Sungai Pinang",
      type: "kontrakan" as const,
      basePrice: "2600000",
      images: ["https://picsum.photos/200/300?random=10"],
      metadata: { minContractMonths: 6, includeFurniture: false },
      amenities: ["wifi", "parkir_mobil", "dapur"],
    },
  ];

  const unitsData: Record<string, Array<{ name: string; price: string; status: "available" | "booked" | "maintenance" }>> = {
    "Kos Melati Senayan": [
      { name: "Kamar 101", price: "2500000", status: "available" },
      { name: "Kamar 102", price: "2600000", status: "available" },
    ],
    "Kos Mawar Bandung": [
      { name: "Kamar A", price: "1800000", status: "available" },
      { name: "Kamar B", price: "1900000", status: "available" },
    ],
    "Kos Anggrek Semarang": [
      { name: "Kamar 1A", price: "1600000", status: "available" },
    ],
    "Kos Dahlia Yogyakarta": [
      { name: "Kamar 01", price: "1400000", status: "available" },
      { name: "Kamar 02", price: "1500000", status: "available" },
    ],
    "Kos Kenanga Surabaya": [
      { name: "Kamar Deluxe", price: "2200000", status: "available" },
    ],
    "Kos Cempaka Malang": [
      { name: "Kamar 201", price: "1200000", status: "available" },
      { name: "Kamar 202", price: "1300000", status: "available" },
    ],
    "Kontrakan Keluarga Bali": [
      { name: "Rumah Utama", price: "3500000", status: "available" },
    ],
    "Kontrakan Harmoni Medan": [
      { name: "Lantai 1", price: "2800000", status: "available" },
      { name: "Lantai 2", price: "2600000", status: "available" },
    ],
    "Kontrakan Makassar Indah": [
      { name: "Rumah A", price: "3200000", status: "available" },
    ],
    "Kontrakan Samarinda Baru": [
      { name: "Unit 1", price: "2600000", status: "available" },
      { name: "Unit 2", price: "2500000", status: "available" },
    ],
  };

  console.log("🌱 Starting extra database seed...");

  await db.transaction(async (tx) => {
    console.log("📝 Inserting extra users...");
    const existingEmails = new Set(
      (await tx.select().from(schema.users)).map((u) => u.email),
    );

    for (const user of newUsers) {
      if (existingEmails.has(user.email)) {
        console.log(`  ⏭️  Skipped user ${user.email} (already exists)`);
        continue;
      }
      await tx.insert(schema.users).values(user);
      console.log(`  ✅ Created user: ${user.email} (${user.role})`);
    }

    console.log("📝 Inserting extra accounts...");
    const dbUsers = await tx.select().from(schema.users);
    const emailToUser = new Map(dbUsers.map((u) => [u.email, u]));

    for (const account of newAccounts) {
      const user = emailToUser.get(account.accountId);
      if (!user) {
        console.log(`  ⚠️  Skipped account ${account.accountId} (user not found)`);
        continue;
      }
      account.userId = user.id;

      const existing = await tx
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.accountId, account.accountId))
        .limit(1);
      if (existing.length > 0) {
        console.log(`  ⏭️  Skipped account ${account.accountId} (already exists)`);
        continue;
      }
      await tx.insert(schema.accounts).values(account);
      console.log(`  ✅ Created account: ${account.accountId}`);
    }

    console.log("📝 Inserting extra properties...");
    const existingProps = await tx.select().from(schema.properties);
    const propMap = new Map(existingProps.map((p) => [p.name, p]));

    const ownerEmails = newUsers.filter((u) => u.role === "owner").map((u) => u.email);
    const ownerIds = ownerEmails.map((e) => emailToUser.get(e)!.id);

    const createdPropertyIds: Record<string, string> = {};

    for (const prop of propertiesData) {
      if (propMap.has(prop.name)) {
        console.log(`  ⏭️  Skipped property: ${prop.name} (already exists)`);
        const existing = await tx.select().from(schema.properties).where(eq(schema.properties.name, prop.name)).limit(1);
        if (existing.length > 0) {
          createdPropertyIds[prop.name] = existing[0].id;
        }
        continue;
      }

      const ownerId = ownerIds[Math.floor(Math.random() * ownerIds.length)];
      const [created] = await tx.insert(schema.properties).values({
        id: randomUUID(),
        ownerId,
        name: prop.name,
        description: prop.description,
        address: prop.address,
        province: prop.province,
        city: prop.city,
        district: prop.district,
        type: prop.type,
        basePrice: prop.basePrice,
        packages: {
          predefined: [],
          custom: {
            enabled: false,
            label: "Custom Duration",
            unit: "days",
            pricePerUnit: 0,
            minDuration: 1,
            maxDuration: 365,
          },
        },
        amenities: prop.amenities,
        metadata: prop.metadata,
        images: prop.images,
        isActive: true,
        isFeatured: false,
        gpsVerified: false,
        status: "aktif",
      }).returning();
      createdPropertyIds[prop.name] = created.id;
      console.log(`  ✅ Created property: ${prop.name} (${prop.province})`);
    }

    console.log("📝 Inserting extra units...");
    const existingUnits = await tx.select().from(schema.units);
    const unitMap = new Map(existingUnits.map((u) => [u.name, u]));

    for (const [propName, units] of Object.entries(unitsData)) {
      const propertyId = createdPropertyIds[propName];
      if (!propertyId) continue;

      for (const unit of units) {
        if (unitMap.has(unit.name)) {
          console.log(`  ⏭️  Skipped unit: ${unit.name} (already exists)`);
          continue;
        }
        await tx.insert(schema.units).values({
          id: randomUUID(),
          propertyId,
          name: unit.name,
          price: unit.price,
          capacity: "1",
          size: "12",
          status: unit.status,
          metadata: {},
          roomSize: "12",
          electricityIncluded: false,
          furnitureIncluded: false,
        });
        console.log(`  ✅ Created unit: ${unit.name} (${propName})`);
      }
    }

    console.log("📝 Inserting iklan...");
    const existingAds = await tx.select().from(schema.propertyAds);
    if (existingAds.length > 0) {
      console.log("  ⏭️  Skipped iklan (already exists)");
    } else {
      const adPackage = await tx.select().from(schema.adPackages).limit(1);
      let packageId: string | undefined;
      if (adPackage.length > 0) {
        packageId = adPackage[0].id;
      } else {
        const [newPkg] = await tx.insert(schema.adPackages).values({
          id: randomUUID(),
          name: "iklan_seed_7d",
          label: "Iklan Seed 7 Hari",
          tier: "reguler",
          duration: 7,
          price: "59900",
          positionType: "rotation",
          sortOrder: 1,
          isActive: true,
        }).returning();
        packageId = newPkg.id;
      }

      const targetPropName = Object.keys(createdPropertyIds)[0];
      const targetPropId = createdPropertyIds[targetPropName];

      await tx.insert(schema.propertyAds).values({
        id: randomUUID(),
        propertyId: targetPropId,
        packageId,
        advertiserName: "Iklan KonkosYuk",
        advertiserPhone: "081234567890",
        advertiserWhatsApp: "081234567890",
        title: "Promo Kos Melati Senayan",
        description: "Dapatkan harga spesial untuk kos di Jakarta Selatan. Fasilitas lengkap dan aman.",
        imageUrl: "https://picsum.photos/200/300?random=99",
        targetUrl: `https://konkosyuk.app/properties/${targetPropId}`,
        location: "Jakarta Selatan",
        price: "2500000",
        type: "kos",
        position: 0,
        isActive: true,
        clicks: 0,
        impressions: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        paymentStatus: "paid",
        paidAt: new Date(),
      });
      console.log(`  ✅ Created iklan: Promo Kos Melati Senayan`);
    }

    console.log("🌱 Extra database seed completed successfully!");
  });
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
