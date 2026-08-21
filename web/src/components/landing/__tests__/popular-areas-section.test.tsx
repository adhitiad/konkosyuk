import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PopularAreasSection } from "@/components/landing/popular-areas-section";

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

vi.mock("@/lib/cloudinary", () => ({
  getCloudinaryUrl: (publicId: string, options?: Record<string, unknown>) => {
    let url = `https://res.cloudinary.com/test/image/upload/${publicId}`;
    if (options) {
      const params: string[] = [];
      if (options.width) params.push(`w_${options.width}`);
      if (options.height) params.push(`h_${options.height}`);
      if (options.quality) params.push(`q_${options.quality}`);
      if (params.length > 0) url += `?${params.join(',')}`;
    }
    return url;
  },
}));

describe("PopularAreasSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays loading skeleton while fetching", () => {
    const mockFetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    global.fetch = mockFetch;

    render(<PopularAreasSection />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays area cards after data loaded", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ areas: mockAreas }),
        ok: true,
        status: 200,
      }),
    ) as unknown as typeof fetch;
    global.fetch = mockFetch;

    render(<PopularAreasSection />);

    await waitFor(() => {
      expect(screen.getByText("Kos Yogyakarta")).toBeInTheDocument();
    });

    expect(screen.getByText("Kos Jakarta Selatan")).toBeInTheDocument();
  });

  it("each card has link to /properties?area={slug}", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ areas: mockAreas }),
        ok: true,
        status: 200,
      }),
    ) as unknown as typeof fetch;
    global.fetch = mockFetch;

    render(<PopularAreasSection />);

    await waitFor(() => {
      expect(screen.getByText("Kos Yogyakarta")).toBeInTheDocument();
    });

    const links = document.querySelectorAll('a[href*="/properties?area="]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute("href", "/properties?area=yogyakarta");
    expect(links[1]).toHaveAttribute("href", "/properties?area=jakarta-selatan");
  });

  it("displays area name and propertyCount", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ areas: mockAreas }),
        ok: true,
        status: 200,
      }),
    ) as unknown as typeof fetch;
    global.fetch = mockFetch;

    render(<PopularAreasSection />);

    await waitFor(() => {
      expect(screen.getByText("Kos Yogyakarta")).toBeInTheDocument();
    });

    expect(screen.getByText("10 properti")).toBeInTheDocument();
    expect(screen.getByText("5 properti")).toBeInTheDocument();
  });

  it("does not render if data is empty", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ areas: [] }),
        ok: true,
        status: 200,
      }),
    ) as unknown as typeof fetch;
    global.fetch = mockFetch;

    const { container } = render(<PopularAreasSection />);

    await waitFor(() => {
      expect(container.innerHTML).toBe("");
    });
  });
});
