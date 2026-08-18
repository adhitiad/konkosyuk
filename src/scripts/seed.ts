import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

const ACCOUNTS = [
  { code: "1000", name: "Kas", type: "asset" },
  { code: "1100", name: "Kas Bank", type: "asset" },
  { code: "1111", name: "Pajak Pemerintah", type: "liability" },
  { code: "2222", name: "Lainnya", type: "asset" },
  { code: "4000", name: "Pendapatan Fee Platform", type: "revenue" },
  { code: "4001", name: "Biaya Server / Hosting", type: "expense" },
  { code: "4002", name: "Biaya Database (Supabase)", type: "expense" },
  { code: "4003", name: "Biaya Transaksi Payment Gateway", type: "expense" },
  { code: "4004", name: "Biaya Redis", type: "expense" },
  { code: "4055", name: "Biaya Domain", type: "expense" },
  { code: "5000", name: "Biaya Payment Gateway", type: "expense" },
  { code: "5100", name: "Refund", type: "expense" },
  { code: "5200", name: "Kewajiban Pembayaran Owner", type: "liability" },
  { code: "7011", name: "DP Masuk", type: "liability" },
  { code: "7001", name: "Kredit", type: "revenue" },
  { code: "8001", name: "Debit", type: "expense" },
  { code: "8021", name: "Biaya Admin Platform", type: "expense" },
  { code: "8010", name: "Refund Expense", type: "expense" },
] as const;

async function seed() {
  console.log("Seeding chart of accounts...");
  
  for (const account of ACCOUNTS) {
    const [existing] = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.accountCode, account.code))
      .limit(1);

    if (existing) {
      console.log(`  Skipping ${account.code} - ${account.name} (already exists)`);
      continue;
    }

    await db.insert(chartOfAccounts).values({
      id: crypto.randomUUID(),
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      isActive: true,
    });

    console.log(`  Created ${account.code} - ${account.name}`);
  }

  console.log("Chart of accounts seeded successfully!");
}

seed().catch((err) => {
  console.error("Failed to seed chart of accounts:", err);
  process.exit(1);
});
