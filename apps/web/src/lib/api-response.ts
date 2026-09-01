export function unwrapApiResponse<T>(response: unknown): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    const candidate = (response as { data?: T }).data;
    if (candidate !== undefined) return candidate;
  }
  return response as T;
}
