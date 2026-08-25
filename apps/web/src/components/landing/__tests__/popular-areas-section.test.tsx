// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PopularAreasSection } from "@/components/landing/popular-areas-section";

const mockT = vi.fn((key: string, params?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    title: "Area Populer",
    subtitle: "Temukan kos di area favorit",
    viewAll: "Lihat Semua",
    viewAllMobile: "Lihat Semua",
    propertyCount: params?.count ? `${params.count} properti` : "0 properti",
  };
  return translations[key] || key;
});

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
}));

vi.mock("@/config", () => ({
  Link: (props: Record<string, unknown>) => {
    const { href, children, ...rest } = props;
    return (
      <a href={href as string} {...rest}>
        {children as React.ReactNode}
      </a>
    );
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  getCloudinaryUrl: (publicId: string, options?: Record<string, unknown>) => {
    let url = `https://res.cloudinary.com/test/image/upload/${publicId}`;
    if (options) {
      const params: string[] = [];
      if (options.width) params.push(`w_${options.width}`);
      if (options.height) params.push(`h_${options.height}`);
      if (options.quality) params.push(`q_${options.quality}`);
      if (params.length > 0) url += `?${params.join(",")}`;
    }
    return url;
  },
}));

const mockApiGet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/axios", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockAreas = [
  {
    id: "1",
    slug: "yogyakarta",
    name: "Kos Yogyakarta",
    imageKey: "konkosyuk/areas/yogyakarta",
    propertyCount: 10,
  },
  {
    id: "2",
    slug: "jakarta-selatan",
    name: "Kos Jakarta Selatan",
    imageKey: "konkosyuk/areas/jakarta-selatan",
    propertyCount: 5,
  },
];

describe("PopularAreasSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockT.mockClear();
    mockApiGet.mockReset();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("displays loading skeleton while fetching", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));

    render(<PopularAreasSection />, { wrapper: createWrapper() });

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays area cards after data loaded", async () => {
    mockApiGet.mockResolvedValue({
      data: { success: true, data: { areas: mockAreas } },
    });

    render(<PopularAreasSection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Kos Yogyakarta")).toBeInTheDocument();
    });

    expect(screen.getByText("Kos Jakarta Selatan")).toBeInTheDocument();
  });

  it("each card has link to /properties?area={slug}", async () => {
    mockApiGet.mockResolvedValue({
      data: { success: true, data: { areas: mockAreas } },
    });

    render(<PopularAreasSection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Kos Yogyakarta")).toBeInTheDocument();
    });

    const links = document.querySelectorAll('a[href*="/properties?area="]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute("href", "/properties?area=yogyakarta");
    expect(links[1]).toHaveAttribute(
      "href",
      "/properties?area=jakarta-selatan",
    );
  });

  it("displays area name and propertyCount", async () => {
    mockApiGet.mockResolvedValue({
      data: { success: true, data: { areas: mockAreas } },
    });

    render(<PopularAreasSection />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Kos Yogyakarta")).toBeInTheDocument();
    });

    expect(screen.getByText("10 properti")).toBeInTheDocument();
    expect(screen.getByText("5 properti")).toBeInTheDocument();
  });

  it("does not render if data is empty", async () => {
    mockApiGet.mockResolvedValue({
      data: { success: true, data: { areas: [] } },
    });

    const { container } = render(<PopularAreasSection />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(container.innerHTML).toBe("");
    });
  });
});
