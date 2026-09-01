import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import idMessages from "@/messages/id.json";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  useParams: () => ({}),
}));

const translationCache: Record<string, Record<string, string>> = {};

function getTranslations(namespace: string) {
  if (!translationCache[namespace]) {
    const keys = namespace.split(".");
    let current: Record<string, unknown> = idMessages as Record<string, unknown>;
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key] as Record<string, unknown>;
      } else {
        current = {};
        break;
      }
    }
    translationCache[namespace] = current as Record<string, string>;
  }
  return translationCache[namespace];
}

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useLocale: () => "id",
    useTranslations: () => (key: string, values?: Record<string, unknown>) => {
      const translation = getTranslations("filterChips")[key];
      if (translation) {
        if (values) {
          return translation.replace(/\{(\w+)\}/g, (_, k) =>
            typeof values[k] === "string" ? values[k] : _,
          );
        }
        return translation;
      }
      return key;
    },
    NextIntlClientProvider: actual.NextIntlClientProvider,
  };
});

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        role: "cust",
      },
    },
    isPending: false,
  }),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

afterEach(() => {
  cleanup();
});
