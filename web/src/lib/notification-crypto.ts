import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

type EncryptedValue = {
  __encrypted: true;
  version: 1;
  iv: string;
  tag: string;
  data: string;
};

function getKey(): Buffer {
  const encoded = process.env.NOTIFICATION_ENCRYPTION_KEY;
  if (!encoded) {
    throw new Error(
      "NOTIFICATION_ENCRYPTION_KEY is required to encrypt notification credentials",
    );
  }
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error(
      "NOTIFICATION_ENCRYPTION_KEY must be a base64-encoded 32-byte key",
    );
  }
  return key;
}

export function encryptNotificationValue(plaintext: string): EncryptedValue {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([
    cipher.update(plaintext, "utf8"),
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

export function decryptNotificationValue(value: unknown): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  let parsed: unknown = value;
  try {
    parsed = JSON.parse(value);
  } catch {
    return value;
  }

  if (
    typeof parsed !== "object" ||
    !parsed ||
    !(parsed as Partial<EncryptedValue>).__encrypted
  ) {
    return value;
  }

  const encrypted = parsed as EncryptedValue;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
