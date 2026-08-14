import * as dotenv from "dotenv";
import {
  decryptPaymentConfig,
  encryptPaymentConfig,
  splitPaymentConfig,
} from "@/lib/payment-config-crypto";
import { eq } from "drizzle-orm";

async function main() {
  dotenv.config({ path: ".env.local" });
  const { db } = await import("@/db");
  const { paymentGatewayConfigs, paymentGatewayCredentials } =
    await import("@/db/schema");
  const rows = await db.select().from(paymentGatewayConfigs);
  let migrated = 0;

  for (const row of rows) {
    const [existingCredential] = await db
      .select({ id: paymentGatewayCredentials.id })
      .from(paymentGatewayCredentials)
      .where(eq(paymentGatewayCredentials.gatewayId, row.id))
      .limit(1);
    if (existingCredential) continue;

    const { publicConfig, secretConfig } = splitPaymentConfig(
      decryptPaymentConfig(row.config),
    );
    await db.transaction(async (tx) => {
      await tx
        .update(paymentGatewayConfigs)
        .set({ config: publicConfig, updatedAt: new Date() })
        .where(eq(paymentGatewayConfigs.id, row.id));
      await tx.insert(paymentGatewayCredentials).values({
        id: crypto.randomUUID(),
        gatewayId: row.id,
        encryptedConfig: encryptPaymentConfig(secretConfig),
      });
    });

    migrated += 1;
  }

  console.log(`Encrypted ${migrated} payment gateway configuration(s).`);
}

main().catch((error) => {
  console.error(
    "Payment gateway migration failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
