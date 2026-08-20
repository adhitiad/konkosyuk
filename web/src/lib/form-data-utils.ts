export function parseJsonArrayField(
  formData: FormData,
  key: string,
): unknown[] {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.length === 0) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`${key} harus array JSON`);
    }
    return parsed;
  } catch {
    throw new Error(
      `Field ${key} berisi JSON tidak valid: "${raw.slice(0, 50)}"`,
    );
  }
}
