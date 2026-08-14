import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const SENSITIVE_KEYS = new Set([
  "secretKey",
  "webhookSecret",
  "apiKey",
  "merchantKey",
  "sharedKey",
  "token",
  "password",
  "clientSecret",
  "privateKey",
  "accessToken",
  "refreshToken",
]);

type EncryptedConfig = {
  __encrypted: true;
  version: 1;
  iv: string;
  tag: string;
  data: string;
};

function getKey(): Buffer {
  const encoded = process.env.PAYMENT_CONFIG_ENCRYPTION_KEY;
  if (!encoded)
    throw new Error(
      "PAYMENT_CONFIG_ENCRYPTION_KEY is required to read payment credentials",
    );
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32)
    throw new Error(
      "PAYMENT_CONFIG_ENCRYPTION_KEY must be a base64-encoded 32-byte key",
    );
  return key;
}

export function isSensitiveKey(key: string) {
  return (
    SENSITIVE_KEYS.has(key) || /secret|token|password|key|credential/i.test(key)
  );
}

export function encryptPaymentConfig(
  config: Record<string, unknown>,
): EncryptedConfig {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(config), "utf8"),
    cipher.final(),
  ]);
  return {
    __encrypted: true,
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  };
}

export function decryptPaymentConfig(value: unknown): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    !(value as Partial<EncryptedConfig>).__encrypted
  ) {
    return (value ?? {}) as Record<string, unknown>;
  }
  const encrypted = value as EncryptedConfig;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(encrypted.data, "base64")),
      decipher.final(),
    ]).toString("utf8"),
  ) as Record<string, unknown>;
}

export function sanitizePaymentConfig(config: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (isSensitiveKey(key)) {
      safe[`${key}Configured`] =
        typeof value === "string" ? value.length > 0 : Boolean(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      safe[key] = sanitizePaymentConfig(value as Record<string, unknown>);
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

export function mergePaymentConfig(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      isSensitiveKey(key) &&
      (value === undefined || value === null || value === "")
    )
      continue;
    merged[key] = value;
  }
  return merged;
}

export function splitPaymentConfig(config: Record<string, unknown>) {
  const publicConfig: Record<string, unknown> = {};
  const secretConfig: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (isSensitiveKey(key)) secretConfig[key] = value;
    else publicConfig[key] = value;
  }
  return { publicConfig, secretConfig };
}
