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

async function seed() {
  console.log("🌱 Starting database seed...");

  const hashedPasswords = {
    admin: await hashPassword("Admin123!"),
    staff: await hashPassword("Staff123!"),
    owner: await hashPassword("Owner123!"),
    cust: await hashPassword("Cust123!"),
  };

  const userData = [
    {
      id: randomUUID(),
      email: "admin@booking.com",
      name: "Admin Platform",
      role: "admin" as const,
    },
    {
      id: randomUUID(),
      email: "staff@booking.com",
      name: "Staff Operasional",
      role: "staff" as const,
    },
    {
      id: randomUUID(),
      email: "owner1@booking.com",
      name: "Budi Kost",
      role: "owner" as const,
    },
    {
      id: randomUUID(),
      email: "owner2@booking.com",
      name: "Siti Kontrakan",
      role: "owner" as const,
    },
    {
      id: randomUUID(),
      email: "cust1@booking.com",
      name: "Andi Penyewa",
      role: "cust" as const,
    },
    {
      id: randomUUID(),
      email: "cust2@booking.com",
      name: "Rina Penyewa",
      role: "cust" as const,
    },
    {
      id: randomUUID(),
      email: "cust3@booking.com",
      name: "Joko Penyewa",
      role: "cust" as const,
    },
  ];

  const accountData = [
    {
      id: randomUUID(),
      userId: "",
      accountId: "admin@booking.com",
      providerId: "credential",
      password: hashedPasswords.admin,
    },
    {
      id: randomUUID(),
      userId: "",
      accountId: "staff@booking.com",
      providerId: "credential",
      password: hashedPasswords.staff,
    },
    {
      id: randomUUID(),
      userId: "",
      accountId: "owner1@booking.com",
      providerId: "credential",
      password: hashedPasswords.owner,
    },
    {
      id: randomUUID(),
      userId: "",
      accountId: "owner2@booking.com",
      providerId: "credential",
      password: hashedPasswords.owner,
    },
    {
      id: randomUUID(),
      userId: "",
      accountId: "cust1@booking.com",
      providerId: "credential",
      password: hashedPasswords.cust,
    },
    {
      id: randomUUID(),
      userId: "",
      accountId: "cust2@booking.com",
      providerId: "credential",
      password: hashedPasswords.cust,
    },
    {
      id: randomUUID(),
      userId: "",
      accountId: "cust3@booking.com",
      providerId: "credential",
      password: hashedPasswords.cust,
    },
  ];

  let melatiId: string;
  let merdekaId: string;
  let keluargaId: string;

  await db.transaction(async (tx) => {
    console.log("📝 Inserting users...");
    for (const user of userData) {
      const existing = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, user.email))
        .limit(1);
      if (existing.length > 0) {
        console.log(`  ⏭️  Skipped user ${user.email} (already exists)`);
        continue;
      }
      await tx.insert(schema.users).values(user);
      console.log(`  ✅ Created user: ${user.email} (${user.role})`);
    }

    console.log("📝 Inserting accounts...");
    const dbUsers = await tx.select().from(schema.users);
    const emailToUser = new Map(dbUsers.map((u) => [u.email, u]));

    for (const account of accountData) {
      const user = emailToUser.get(account.accountId);
      if (!user) {
        console.log(
          `  ⚠️  Skipped account ${account.accountId} (user not found)`,
        );
        continue;
      }
      account.userId = user.id;

      const existing = await tx
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.accountId, account.accountId))
        .limit(1);
      if (existing.length > 0) {
        console.log(
          `  ⏭️  Skipped account ${account.accountId} (already exists)`,
        );
        continue;
      }
      await tx.insert(schema.accounts).values(account);
      console.log(`  ✅ Created account: ${account.accountId}`);
    }

    console.log("📝 Inserting properties...");

    const existingProps = await tx.select().from(schema.properties);
    const propMap = new Map(existingProps.map((p) => [p.name, p]));

    const kostMelati = propMap.get("Kost Melati Syariah");
    if (!kostMelati) {
      const melati = await tx
        .insert(schema.properties)
        .values({
          id: randomUUID(),
          ownerId: emailToUser.get("owner1@booking.com")!.id,
          name: "Kost Melati Syariah",
          description: "Kost syariah dengan lingkungan yang nyaman",
          address: "Jl. Melati No. 1, Jakarta Selatan",
          type: "kost",
          metadata: {
            includeMeals: false,
            curfew: "23:00",
            gender: "putra",
          },
        })
        .returning();
      console.log("  ✅ Created property: Kost Melati Syariah");
      melatiId = melati[0].id;
    } else {
      console.log(
        "  ⏭️  Skipped property: Kost Melati Syariah (already exists)",
      );
      melatiId = kostMelati.id;
    }

    const kostMerdeka = propMap.get("Kost Putra Merdeka");
    if (!kostMerdeka) {
      const merdeka = await tx
        .insert(schema.properties)
        .values({
          id: randomUUID(),
          ownerId: emailToUser.get("owner1@booking.com")!.id,
          name: "Kost Putra Merdeka",
          description: "Kost putra dengan fasilitas lengkap",
          address: "Jl. Merdeka No. 5, Bandung",
          type: "kost",
          metadata: {
            includeMeals: true,
            curfew: "22:00",
            gender: "putra",
          },
        })
        .returning();
      console.log("  ✅ Created property: Kost Putra Merdeka");
      merdekaId = merdeka[0].id;
    } else {
      console.log(
        "  ⏭️  Skipped property: Kost Putra Merdeka (already exists)",
      );
      merdekaId = kostMerdeka.id;
    }

    const kontrakanKeluarga = propMap.get("Kontrakan Rumah Keluarga");
    if (!kontrakanKeluarga) {
      const keluarga = await tx
        .insert(schema.properties)
        .values({
          id: randomUUID(),
          ownerId: emailToUser.get("owner2@booking.com")!.id,
          name: "Kontrakan Rumah Keluarga",
          description: "Kontrakan rumah keluarga di Surabaya",
          address: "Jl. Keluarga No. 10, Surabaya",
          type: "kontrakan",
          metadata: {
            minContractMonths: 12,
            includeFurniture: false,
          },
        })
        .returning();
      console.log("  ✅ Created property: Kontrakan Rumah Keluarga");
      keluargaId = keluarga[0].id;
    } else {
      console.log(
        "  ⏭️  Skipped property: Kontrakan Rumah Keluarga (already exists)",
      );
      keluargaId = kontrakanKeluarga.id;
    }

    console.log("📝 Inserting units...");

    const existingUnits = await tx.select().from(schema.units);
    const unitMap = new Map(existingUnits.map((u) => [u.name, u]));

    const melatiUnits = [
      { name: "Kamar 01", price: "1500000" },
      { name: "Kamar 02", price: "1600000" },
      { name: "Kamar 03", price: "1700000" },
      { name: "Kamar 04", price: "1800000" },
    ];
    for (const unit of melatiUnits) {
      if (!unitMap.has(unit.name)) {
        await tx.insert(schema.units).values({
          id: randomUUID(),
          propertyId: melatiId,
          name: unit.name,
          price: unit.price,
          status: "available",
        });
        console.log(
          `  ✅ Created unit: ${unit.name} (Kost Melati) - Rp${unit.price}`,
        );
      } else {
        console.log(`  ⏭️  Skipped unit: ${unit.name} (already exists)`);
      }
    }

    const merdekaUnits = [
      { name: "Kamar A", price: "1200000" },
      { name: "Kamar B", price: "1300000" },
      { name: "Kamar C", price: "1400000" },
    ];
    for (const unit of merdekaUnits) {
      if (!unitMap.has(unit.name)) {
        await tx.insert(schema.units).values({
          id: randomUUID(),
          propertyId: merdekaId,
          name: unit.name,
          price: unit.price,
          status: "available",
        });
        console.log(
          `  ✅ Created unit: ${unit.name} (Kost Merdeka) - Rp${unit.price}`,
        );
      } else {
        console.log(`  ⏭️  Skipped unit: ${unit.name} (already exists)`);
      }
    }

    const keluargaUnits = [
      { name: "Rumah Utama", price: "25000000" },
      { name: "Rumah Tipe B", price: "20000000" },
      { name: "Rumah Tipe C", price: "18000000" },
    ];
    for (const unit of keluargaUnits) {
      if (!unitMap.has(unit.name)) {
        await tx.insert(schema.units).values({
          id: randomUUID(),
          propertyId: keluargaId,
          name: unit.name,
          price: unit.price,
          status: "available",
        });
        console.log(
          `  ✅ Created unit: ${unit.name} (Kontrakan Keluarga) - Rp${unit.price}`,
        );
      } else {
        console.log(`  ⏭️  Skipped unit: ${unit.name} (already exists)`);
      }
    }

    console.log("🌱 Database seed completed successfully!");
  });
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
