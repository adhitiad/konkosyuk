import { db } from "@/db";
import { inspectionTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const DEFAULT_TEMPLATES = [
  {
    propertyType: "kost" as const,
    isDefault: true,
    items: [
      { category: "electrical", itemName: "Lampu Ruangan", description: "Semua lampu menyala dan tidak rusak", isRequired: true },
      { category: "electrical", itemName: "Stop Kontak", description: "Semua stop kontak berfungsi", isRequired: true },
      { category: "electrical", itemName: "Kabel & Wiring", description: "Tidak ada kabel yang terbuka atau rusak", isRequired: false },
      { category: "furniture", itemName: "Kasur / Matras", description: "Tidak ada lubang, stain, atau kerusakan", isRequired: true },
      { category: "furniture", itemName: "Lemari", description: "Pintu lemari berfungsi dengan baik", isRequired: true },
      { category: "furniture", itemName: "Meja & Kursi", description: "Struktur stabil, tidak goyang", isRequired: false },
      { category: "plumbing", itemName: "Kran Air", description: "Air mengalir lancar, tidak bocor", isRequired: true },
      { category: "plumbing", itemName: "Toilet / Kloset", description: "Siram lancar, tidak mampet", isRequired: true },
      { category: "plumbing", itemName: "Shower", description: "Air shower mengalir dengan baik", isRequired: true },
      { category: "bathroom", itemName: "Keramik Dinding", description: "Tidak ada yang retak atau lepas", isRequired: true },
      { category: "bathroom", itemName: "Wastafel", description: "Tidak bocor, wastafel tidak retak", isRequired: true },
      { category: "walls", itemName: "Dinding", description: "Tidak ada noda, retak, atau kerusakan", isRequired: true },
      { category: "floor", itemName: "Lantai", description: "Tidak ada kerusakan atau yang lepas", isRequired: true },
      { category: "doors_windows", itemName: "Pintu Kamar", description: "Kunci pintu berfungsi dengan baik", isRequired: true },
      { category: "doors_windows", itemName: "Jendela", description: "Kaca utuh, engsel berfungsi", isRequired: true },
      { category: "ac", itemName: "AC", description: "AC dingin, remote berfungsi", isRequired: false },
      { category: "other", itemName: "Kunci / Akses", description: "Semua kunci dan akses card tersedia", isRequired: true },
    ],
  },
  {
    propertyType: "kontrakan" as const,
    isDefault: true,
    items: [
      { category: "electrical", itemName: "Lampu Ruangan", description: "Semua lampu menyala dan tidak rusak", isRequired: true },
      { category: "electrical", itemName: "Stop Kontak", description: "Semua stop kontak berfungsi", isRequired: true },
      { category: "electrical", itemName: "MCB / Saklar", description: "Listrik aman, tidak ada yang panas", isRequired: true },
      { category: "furniture", itemName: "Sofa / Sofa Bed", description: "Tidak ada lubang atau stain", isRequired: false },
      { category: "furniture", itemName: "Lemari Pakaian", description: "Pintu lemari berfungsi dengan baik", isRequired: true },
      { category: "furniture", itemName: "Rak / Kabinet", description: "Struktur stabil, tidak goyang", isRequired: false },
      { category: "plumbing", itemName: "Kran Air", description: "Air mengalir lancar, tidak bocor", isRequired: true },
      { category: "plumbing", itemName: "Toilet / Kloset", description: "Siram lancar, tidak mampet", isRequired: true },
      { category: "plumbing", itemName: "Shower / Bathtub", description: "Air mengalir dengan baik, tidak bocor", isRequired: true },
      { category: "kitchen", itemName: "Kompor", description: "Kompor menyala dengan baik", isRequired: true },
      { category: "kitchen", itemName: "Kitchen Set", description: "Kabinet dapur berfungsi dengan baik", isRequired: true },
      { category: "kitchen", itemName: "Exhaust / Ventilasi", description: "Kipas dapur berfungsi", isRequired: false },
      { category: "bathroom", itemName: "Keramik Dinding", description: "Tidak ada yang retak atau lepas", isRequired: true },
      { category: "bathroom", itemName: "Wastafel", description: "Tidak bocor, wastafel tidak retak", isRequired: true },
      { category: "bathroom", itemName: "Shower", description: "Air shower mengalir dengan baik", isRequired: true },
      { category: "walls", itemName: "Dinding", description: "Tidak ada noda, retak, atau kerusakan", isRequired: true },
      { category: "floor", itemName: "Lantai", description: "Tidak ada kerusakan atau yang lepas", isRequired: true },
      { category: "doors_windows", itemName: "Pintu Depan", description: "Kunci pintu berfungsi dengan baik", isRequired: true },
      { category: "doors_windows", itemName: "Jendela", description: "Kaca utuh, engsel berfungsi", isRequired: true },
      { category: "ac", itemName: "AC", description: "AC dingin, remote berfungsi", isRequired: false },
      { category: "other", itemName: "Taman / Carport", description: "Taman dan carport dalam kondisi baik", isRequired: false },
    ],
  },
  {
    propertyType: "ruko" as const,
    isDefault: true,
    items: [
      { category: "electrical", itemName: "Lampu Ruangan", description: "Semua lampu menyala dan tidak rusak", isRequired: true },
      { category: "electrical", itemName: "Stop Kontak", description: "Semua stop kontak berfungsi", isRequired: true },
      { category: "electrical", itemName: "MCB / Saklar", description: "Listrik aman, tidak ada yang panas", isRequired: true },
      { category: "furniture", itemName: "Sofa / Sofa Bed", description: "Tidak ada lubang atau stain", isRequired: false },
      { category: "furniture", itemName: "Lemari Pakaian", description: "Pintu lemari berfungsi dengan baik", isRequired: true },
      { category: "plumbing", itemName: "Kran Air", description: "Air mengalir lancar, tidak bocor", isRequired: true },
      { category: "plumbing", itemName: "Toilet / Kloset", description: "Siram lancar, tidak mampet", isRequired: true },
      { category: "plumbing", itemName: "Shower", description: "Air shower mengalir dengan baik", isRequired: true },
      { category: "kitchen", itemName: "Kompor", description: "Kompor menyala dengan baik", isRequired: true },
      { category: "kitchen", itemName: "Kitchen Set", description: "Kabinet dapur berfungsi dengan baik", isRequired: true },
      { category: "kitchen", itemName: "Exhaust / Ventilasi", description: "Kipas dapur berfungsi", isRequired: false },
      { category: "bathroom", itemName: "Keramik Dinding", description: "Tidak ada yang retak atau lepas", isRequired: true },
      { category: "bathroom", itemName: "Wastafel", description: "Tidak bocor, wastafel tidak retak", isRequired: true },
      { category: "bathroom", itemName: "Shower", description: "Air shower mengalir dengan baik", isRequired: true },
      { category: "walls", itemName: "Dinding", description: "Tidak ada noda, retak, atau kerusakan", isRequired: true },
      { category: "floor", itemName: "Lantai", description: "Tidak ada kerusakan atau yang lepas", isRequired: true },
      { category: "doors_windows", itemName: "Pintu Depan", description: "Kunci pintu berfungsi dengan baik", isRequired: true },
      { category: "doors_windows", itemName: "Jendela", description: "Kaca utuh, engsel berfungsi", isRequired: true },
      { category: "ac", itemName: "AC", description: "AC dingin, remote berfungsi", isRequired: false },
      { category: "other", itemName: "Taman / Carport", description: "Taman dan carport dalam kondisi baik", isRequired: false },
      { category: "other", itemName: "Plafon", description: "Plafon tidak ada yang lepas atau retak", isRequired: true },
    ],
  },
];

export async function seedInspectionTemplates() {
  console.log("Seeding inspection templates...");

  for (const template of DEFAULT_TEMPLATES) {
    const existing = await db
      .select()
      .from(inspectionTemplates)
      .where(
        and(
          eq(inspectionTemplates.propertyType, template.propertyType),
          eq(inspectionTemplates.isDefault, true),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`Template for ${template.propertyType} already exists, skipping...`);
      continue;
    }

    await db.insert(inspectionTemplates).values({
      propertyType: template.propertyType,
      items: template.items,
      isDefault: template.isDefault,
    });

    console.log(`Created default template for ${template.propertyType} with ${template.items.length} items`);
  }

  console.log("Inspection templates seeded successfully!");
}

if (require.main === module) {
  seedInspectionTemplates()
    .then(() => {
      console.log("Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
