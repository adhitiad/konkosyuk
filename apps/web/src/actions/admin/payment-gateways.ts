"use server";

import { db } from "@/db";
import { paymentGatewayConfigs, paymentGatewayCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";
import { validateActionCsrf } from "@/lib/api-auth";
import {
  decryptPaymentConfig,
  encryptPaymentConfig,
  mergePaymentConfig,
  sanitizePaymentConfig,
  splitPaymentConfig,
} from "@/lib/payment-config-crypto";
import { randomUUID } from "crypto";

const dokuConfigSchema = z.object({
  merchantCode: z.string().min(1, "Merchant code wajib diisi"),
  clientId: z.string().min(1, "Client ID wajib diisi"),
  secretKey: z.string().min(1, "Secret key wajib diisi"),
  webhookSecret: z.string().optional(),
});

const ipaymuConfigSchema = z.object({
  va: z.string().min(1, "VA number wajib diisi"),
  apiKey: z.string().min(1, "API key wajib diisi"),
  webhookSecret: z.string().optional(),
});

const nicepayConfigSchema = z.object({
  merchantId: z.string().min(1, "Merchant ID wajib diisi"),
  merchantKey: z.string().min(1, "Merchant key wajib diisi"),
  webhookSecret: z.string().optional(),
});

const ottoConfigSchema = z.object({
  clientId: z.string().optional(),
  secretKey: z.string().min(1, "Secret key wajib diisi"),
  webhookSecret: z.string().optional(),
});

const providerConfigSchemas: Record<
  string,
  z.ZodType<Record<string, unknown>>
> = {
  doku: dokuConfigSchema,
  ipaymu: ipaymuConfigSchema,
  nicepay: nicepayConfigSchema,
  otto: ottoConfigSchema,
};

const upsertGatewaySchema = z.object({
  provider: z.enum(["doku", "ipaymu", "nicepay", "otto"]),
  config: z.record(z.string(), z.unknown()),
  environment: z.enum(["sandbox", "production"]).default("sandbox"),
  isActive: z.boolean().default(false),
});

export type UpsertPaymentGatewayState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    provider: string;
    config: Record<string, unknown>;
    environment: string | null;
    isActive: boolean | null;
    updatedAt: Date | null;
  };
};

export async function upsertPaymentGatewayAction(
  prevState: UpsertPaymentGatewayState | undefined,
  formData: FormData,
): Promise<UpsertPaymentGatewayState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "admin") {
      return { error: "Dilarang - hanya admin", success: false };
    }

    const rawConfig = formData.get("config");
    const configData =
      typeof rawConfig === "string" ? JSON.parse(rawConfig) : {};

    const validated = upsertGatewaySchema.parse({
      provider: formData.get("provider"),
      config: configData,
      environment: formData.get("environment") || "sandbox",
      isActive: formData.get("isActive") === "true",
    });

    const providerConfig = validated.config as Record<string, unknown>;

    const [existing] = await db
      .select()
      .from(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.id, validated.provider))
      .limit(1);

    const [existingCredential] = await db
      .select()
      .from(paymentGatewayCredentials)
      .where(eq(paymentGatewayCredentials.gatewayId, validated.provider))
      .limit(1);

    const legacyConfig = existing ? decryptPaymentConfig(existing.config) : {};
    const existingSecrets = existingCredential
      ? decryptPaymentConfig(existingCredential.encryptedConfig)
      : {};
    const existingConfig = { ...legacyConfig, ...existingSecrets };
    const mergedConfig = mergePaymentConfig(existingConfig, providerConfig);

    const validation =
      providerConfigSchemas[validated.provider].safeParse(mergedConfig);
    if (!validation.success) {
      return {
        error:
          validation.error.issues[0]?.message ??
          "Konfigurasi gateway tidak valid",
        success: false,
      };
    }

    const { publicConfig, secretConfig } = splitPaymentConfig(mergedConfig);
    const encryptedSecretConfig = encryptPaymentConfig(secretConfig);

    const [savedConfig] = await db.transaction(async (tx) => {
      const [savedConfig] = await tx
        .insert(paymentGatewayConfigs)
        .values({
          id: validated.provider,
          provider: validated.provider,
          config: publicConfig,
          environment: validated.environment,
          isActive: validated.isActive,
        })
        .onConflictDoUpdate({
          target: paymentGatewayConfigs.id,
          set: {
            config: publicConfig,
            environment: validated.environment,
            isActive: validated.isActive,
            updatedAt: new Date(),
          },
        })
        .returning();

      await tx
        .insert(paymentGatewayCredentials)
        .values({
          id: existingCredential?.id ?? randomUUID(),
          gatewayId: validated.provider,
          encryptedConfig: encryptedSecretConfig,
        })
        .onConflictDoUpdate({
          target: paymentGatewayCredentials.gatewayId,
          set: {
            encryptedConfig: encryptedSecretConfig,
            updatedAt: new Date(),
          },
        });

      return [savedConfig];
    });

    const safeConfig = {
      ...savedConfig,
      config: {
        ...sanitizePaymentConfig(mergedConfig),
      },
    };

    await createAuditLog({
      action: "create",
      targetType: "payment_gateway",
      targetId: validated.provider,
      adminId: session.user.id,
      details: {
        provider: validated.provider,
        environment: validated.environment,
        isActive: validated.isActive,
      },
    });

    return { success: true, data: safeConfig };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return {
      error: "Gagal menyimpan konfigurasi payment gateway",
      success: false,
    };
  }
}

const deleteGatewaySchema = z.object({
  provider: z.enum(["doku", "ipaymu", "nicepay", "otto"]),
});

export type DeletePaymentGatewayState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function deletePaymentGatewayAction(
  prevState: DeletePaymentGatewayState | undefined,
  formData: FormData,
): Promise<DeletePaymentGatewayState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "admin") {
      return { error: "Dilarang - hanya admin", success: false };
    }

    const validated = deleteGatewaySchema.parse({
      provider: formData.get("provider"),
    });

    const providerValue = validated.provider;

    await db
      .delete(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.provider, providerValue));

    await createAuditLog({
      action: "delete",
      targetType: "payment_gateway",
      targetId: providerValue,
      adminId: session.user.id,
      details: {
        provider: providerValue,
      },
    });

    return { success: true, message: "Payment gateway berhasil dihapus" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal menghapus payment gateway", success: false };
  }
}
