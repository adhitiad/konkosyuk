import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OwnerProfileCard } from "@/components/property/owner-profile-card";

describe("OwnerProfileCard", () => {
  const owner = {
    name: "Budi Santoso",
    image: "https://example.com/avatar.jpg",
    activeSince: new Date("2020-01-01"),
    transactionCount: 150,
  };

  it("displays owner name", () => {
    render(<OwnerProfileCard owner={owner} propertyId="prop-1" />);

    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
  });

  it("displays 'Aktif sejak' with relative time", () => {
    render(<OwnerProfileCard owner={owner} propertyId="prop-1" />);

    expect(screen.getByText(/Aktif sejak/)).toBeInTheDocument();
  });

  it("displays transaction count", () => {
    render(<OwnerProfileCard owner={owner} propertyId="prop-1" />);

    expect(screen.getByText("150 transaksi berhasil")).toBeInTheDocument();
  });

  it("displays photo when available", () => {
    render(<OwnerProfileCard owner={owner} propertyId="prop-1" />);

    const img = screen.getByAltText("Budi Santoso");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain("avatar.jpg");
  });

  it("displays fallback circle when no photo", () => {
    const ownerWithoutImage = { ...owner, image: null };
    render(<OwnerProfileCard owner={ownerWithoutImage} propertyId="prop-1" />);

    expect(screen.queryByAltText("Budi Santoso")).not.toBeInTheDocument();
  });

  it("displays 'Lihat Semua Properti' link with correct propertyId", () => {
    render(<OwnerProfileCard owner={owner} propertyId="prop-1" />);

    const link = screen.getByText("Lihat Semua Properti");
    expect(link).toHaveAttribute("href", "/owner/properties/prop-1");
  });

  it("does not render when owner is null", () => {
    const { container } = render(
      <OwnerProfileCard owner={null} propertyId="prop-1" />,
    );

    expect(container.firstChild).toBeNull();
  });
});
