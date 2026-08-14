export function sanitizeString(
  input: string | null | undefined,
): string | null | undefined {
  if (!input) return input;

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value) as T[Extract<keyof T, string>];
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) : item,
      ) as T[Extract<keyof T, string>];
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(
        value as Record<string, unknown>,
      ) as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}

export function sanitizeMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!metadata) return metadata;
  return sanitizeObject(metadata);
}
