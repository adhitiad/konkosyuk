export function parseJsonArrayField(
  value: string | null,
  fieldName: string,
): string[] {
  if (!value || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldName} harus berupa array JSON`);
    }
    return parsed as string[];
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(
        `${fieldName}: format JSON tidak valid. Pastikan client mengirim JSON.stringify(array)`,
      );
    }
    throw e;
  }
}
