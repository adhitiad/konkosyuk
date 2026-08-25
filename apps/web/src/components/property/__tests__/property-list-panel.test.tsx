import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropertyListPanel } from "@/components/property/property-list-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/components/property/property-card", () => ({
  PropertyCard: ({ property }: { property: { id: string; name: string } }) => (
    <div data-testid={`property-${property.id}`}>{property.name}</div>
  ),
}));

const mockProperties = [
  {
    id: "1",
    name: "Kos A",
    description: "Desc A",
    address: "Addr A",
    type: "kost" as const,
    metadata: {},
    images: [],
    basePrice: "500000",
    amenities: ["wifi", "ac"],
    latitude: 1,
    longitude: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "2",
    name: "Kos B",
    description: "Desc B",
    address: "Addr B",
    type: "kontrakan" as const,
    metadata: {},
    images: [],
    basePrice: "800000",
    amenities: ["parkir"],
    latitude: 3,
    longitude: 4,
    createdAt: "",
    updatedAt: "",
  },
];

describe("PropertyListPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays property cards", () => {
    render(
      <PropertyListPanel
        properties={mockProperties}
        loading={false}
        totalCount={2}
        currentPage={1}
        pageSize={12}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("property-1")).toBeInTheDocument();
    expect(screen.getByTestId("property-2")).toBeInTheDocument();
  });

  it("displays result count", () => {
    render(
      <PropertyListPanel
        properties={mockProperties}
        loading={false}
        totalCount={2}
        currentPage={1}
        pageSize={12}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Menampilkan 2 dari 2 properti"),
    ).toBeInTheDocument();
  });

  it("shows loading skeleton when loading is true", () => {
    const { container } = render(
      <PropertyListPanel
        properties={[]}
        loading={true}
        totalCount={0}
        currentPage={1}
        pageSize={12}
        onPageChange={vi.fn()}
      />,
    );

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no results", () => {
    render(
      <PropertyListPanel
        properties={[]}
        loading={false}
        totalCount={0}
        currentPage={1}
        pageSize={12}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Tidak Ditemukan")).toBeInTheDocument();
  });

  it("pagination buttons work", () => {
    const onPageChange = vi.fn();
    render(
      <PropertyListPanel
        properties={mockProperties}
        loading={false}
        totalCount={25}
        currentPage={1}
        pageSize={12}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByText("Selanjutnya"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("previous button is disabled on page 1", () => {
    render(
      <PropertyListPanel
        properties={mockProperties}
        loading={false}
        totalCount={25}
        currentPage={1}
        pageSize={12}
        onPageChange={vi.fn()}
      />,
    );

    const prevButton = screen.getByText("Sebelumnya");
    expect(prevButton).toBeDisabled();
  });

  it("next button is disabled on last page", () => {
    render(
      <PropertyListPanel
        properties={mockProperties}
        loading={false}
        totalCount={25}
        currentPage={3}
        pageSize={12}
        onPageChange={vi.fn()}
      />,
    );

    const nextButton = screen.getByText("Selanjutnya");
    expect(nextButton).toBeDisabled();
  });
});
