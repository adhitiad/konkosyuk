import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock("node:path", () => ({
  join: vi.fn((...args: string[]) => args.join("/")),
}));

describe("sync-worker-env.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should filter out NEXT_PUBLIC_ variables", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      [
        "DATABASE_URL=postgres://localhost/test",
        "NEXT_PUBLIC_APP_URL=https://test.com",
        "REDIS_URL=rediss://default:token@upstash.io:6379",
        "NEXT_PUBLIC_SENTRY_DSN=https://sentry.io/123",
      ].join("\n"),
    );

    await import("../sync-worker-env");

    const writtenContent = vi.mocked(fs.writeFileSync).mock
      .calls[0]?.[1] as string;
    expect(writtenContent).toContain("DATABASE_URL");
    expect(writtenContent).toContain("REDIS_URL");
    expect(writtenContent).not.toContain("NEXT_PUBLIC_");
  });

  it("should filter out VERCEL_ variables", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      [
        "DATABASE_URL=postgres://localhost/test",
        "VERCEL_URL=https://test.vercel.app",
        "VERCEL_GIT_COMMIT_SHA=abc123",
        "REDIS_URL=rediss://default:token@upstash.io:6379",
      ].join("\n"),
    );

    await import("../sync-worker-env");

    const writtenContent = vi.mocked(fs.writeFileSync).mock
      .calls[0]?.[1] as string;
    expect(writtenContent).not.toContain("VERCEL_");
    expect(writtenContent).toContain("DATABASE_URL");
  });

  it("should filter out SENTRY_ variables", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      [
        "DATABASE_URL=postgres://localhost/test",
        "SENTRY_DSN=https://sentry.io/123",
        "SENTRY_AUTH_TOKEN=xyz",
        "REDIS_URL=rediss://default:token@upstash.io:6379",
      ].join("\n"),
    );

    await import("../sync-worker-env");

    const writtenContent = vi.mocked(fs.writeFileSync).mock
      .calls[0]?.[1] as string;
    expect(writtenContent).not.toContain("SENTRY_");
    expect(writtenContent).toContain("REDIS_URL");
  });

  it("should filter out empty values", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      [
        "DATABASE_URL=postgres://localhost/test",
        "EMPTY_VALUE=",
        "REDIS_URL=",
        "ANOTHER_KEY=value",
      ].join("\n"),
    );

    await import("../sync-worker-env");

    const writtenContent = vi.mocked(fs.writeFileSync).mock
      .calls[0]?.[1] as string;
    expect(writtenContent).not.toContain("EMPTY_VALUE=");
    expect(writtenContent).not.toContain("REDIS_URL=");
    expect(writtenContent).toContain("ANOTHER_KEY=value");
  });

  it("should ignore comment lines", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      [
        "# This is a comment",
        "DATABASE_URL=postgres://localhost/test",
        "# Another comment",
        "REDIS_URL=rediss://default:token@upstash.io:6379",
      ].join("\n"),
    );

    await import("../sync-worker-env");

    const writtenContent = vi.mocked(fs.writeFileSync).mock
      .calls[0]?.[1] as string;
    expect(writtenContent).not.toContain("# This is a comment");
    expect(writtenContent).toContain("DATABASE_URL");
  });

  it("should fall back to .env if .env.local does not exist", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    vi.mocked(fs.readFileSync).mockReturnValue(
      "DATABASE_URL=postgres://localhost/test\nREDIS_URL=rediss://default:token@upstash.io:6379",
    );

    await import("../sync-worker-env");

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(".env.worker"),
      expect.stringContaining("DATABASE_URL"),
    );
  });

  it("should write to .env.worker", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      "DATABASE_URL=postgres://localhost/test",
    );

    await import("../sync-worker-env");

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      ".env.worker",
      expect.any(String),
    );
  });
});
