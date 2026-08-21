import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CampusAreasSection } from "@/components/landing/campus-areas-section";

const mockAreas = [
  {
    id: "1",
    slug: "ugm-jogja",
    name: "UGM Jogja",
    imageKey: "konkosyuk/campus/ugm",
    propertyCount: 8,
  },
  {
    id: "2",
    slug: "ui-depok",
    name: "UI Depok",
    imageKey: "konkosyuk/campus/ui",
    propertyCount: 12,
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

describe("CampusAreasSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays loading skeleton while fetching", () => {
    const mockFetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    global.fetch = mockFetch;

    render(<CampusAreasSection />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays campus cards after data loaded", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ areas: mockAreas }),
        ok: true,
        status: 200,
      }),
    ) as unknown as typeof fetch;
    global.fetch = mockFetch;

    render(<CampusAreasSection />);

    await waitFor(() => {
      expect(screen.getByText("UGM Jogja")).toBeInTheDocument();
    });

    expect(screen.getByText("UI Depok")).toBeInTheDocument();
  });

  it("each card has link to /properties?campus={slug}", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ areas: mockAreas }),
        ok: true,
        status: 200,
      }),
    ) as unknown as typeof fetch;
    global.fetch = mockFetch;

    render(<CampusAreasSection />);

    await waitFor(() => {
      expect(screen.getByText("UGM Jogja")).toBeInTheDocument();
    });

    const links = document.querySelectorAll('a[href*="/properties?campus="]');
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute("href", "/properties?campus=ugm-jogja");
    expect(links[1]).toHaveAttribute("href", "/properties?campus=ui-depok");
  });

  it("has horizontal layout (icon + text)", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ areas: mockAreas }),
        ok: true,
        status: 200,
      }),
    ) as unknown as typeof fetch;
    global.fetch = mockFetch;

    render(<CampusAreasSection />);

    await waitFor(() => {
      expect(screen.getByText("UGM Jogja")).toBeInTheDocument();
    });

    const cards = document.querySelectorAll(".flex.items-center.gap-3");
    expect(cards.length).toBeGreaterThan(0);
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

    const { container } = render(<CampusAreasSection />);

    await waitFor(() => {
      expect(container.innerHTML).toBe("");
    });
  });
});
