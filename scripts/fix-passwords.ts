import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { eq } from "drizzle-orm"
import { hashPassword } from "@better-auth/utils/password"
import * as schema from "../src/db/schema"

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const pool = new Pool({
  connectionString: DATABASE_URL,
})

const db = drizzle(pool, { schema })

async function fixPasswords() {
  console.log("🔧 Fixing password hashes...")

  const passwords = {
    "admin@booking.com": "Admin123!",
    "staff@booking.com": "Staff123!",
    "owner1@booking.com": "Owner123!",
    "owner2@booking.com": "Owner123!",
    "cust1@booking.com": "Cust123!",
    "cust2@booking.com": "Cust123!",
    "cust3@booking.com": "Cust123!",
  }

  for (const [email, password] of Object.entries(passwords)) {
    const hashedPassword = await hashPassword(password)
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)

    if (user.length === 0) {
      console.log(`  ⚠️  User ${email} not found, skipping`)
      continue
    }

    await db
      .update(schema.accounts)
      .set({ password: hashedPassword })
      .where(eq(schema.accounts.userId, user[0].id))

    console.log(`  ✅ Updated password for ${email}`)
  }

  console.log("🌱 Password fix completed!")
}

fixPasswords().catch((error) => {
  console.error("❌ Fix failed:", error)
  process.exit(1)
})
