import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterChipsBar } from "@/components/property/filter-chips-bar";
import { useState } from "react";

function TestWrapper() {
  const [filters, setFilters] = useState<{
    type?: string;
    duration?: string;
    gender?: string;
    amenities: string[];
  }>({
    type: undefined,
    duration: undefined,
    gender: undefined,
    amenities: [],
  });

  return (
    <FilterChipsBar
      filters={filters}
      onFilterChange={(newFilters) => setFilters(newFilters)}
    />
  );
}

describe("FilterChipsBar", () => {
  it("displays all chips in each row", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Semua Tipe")).toBeInTheDocument();
    expect(screen.getByText("Kost")).toBeInTheDocument();
    expect(screen.getByText("Kontrakan")).toBeInTheDocument();
    expect(screen.getByText("Ruko")).toBeInTheDocument();
    expect(screen.getByText("Semua Durasi")).toBeInTheDocument();
    expect(screen.getByText("Harian")).toBeInTheDocument();
    expect(screen.getByText("Bulanan")).toBeInTheDocument();
    expect(screen.getByText("Tahunan")).toBeInTheDocument();
    expect(screen.getByText("Semua")).toBeInTheDocument();
    expect(screen.getByText("Putra")).toBeInTheDocument();
    expect(screen.getByText("Putri")).toBeInTheDocument();
    expect(screen.getByText("Campuran")).toBeInTheDocument();
    expect(screen.getByText("WiFi")).toBeInTheDocument();
    expect(screen.getByText("AC")).toBeInTheDocument();
    expect(screen.getByText("Parkir")).toBeInTheDocument();
  });

  it("clicking 'Kost' sets type to 'kost' and resets others in same row", () => {
    render(<TestWrapper />);

    fireEvent.click(screen.getByText("Kost"));
    expect(screen.getByText("Kost").closest("button")).toHaveClass(
      "bg-primary",
    );
  });

  it("clicking active chip 'Kost' again resets to undefined", () => {
    render(<TestWrapper />);

    fireEvent.click(screen.getByText("Kost"));
    expect(screen.getByText("Kost").closest("button")).toHaveClass(
      "bg-primary",
    );

    fireEvent.click(screen.getByText("Kost"));
    expect(screen.getByText("Kost").closest("button")).not.toHaveClass(
      "bg-primary",
    );
  });

  it("amenities toggle on/off per chip", () => {
    render(<TestWrapper />);

    fireEvent.click(screen.getByText("WiFi"));
    expect(screen.getByText("WiFi").closest("button")).toHaveClass(
      "bg-primary",
    );

    fireEvent.click(screen.getByText("AC"));
    expect(screen.getByText("AC").closest("button")).toHaveClass(
      "bg-primary",
    );

    fireEvent.click(screen.getByText("WiFi"));
    expect(screen.getByText("WiFi").closest("button")).not.toHaveClass(
      "bg-primary",
    );
  });

  it("multiple amenities can be active simultaneously", () => {
    render(<TestWrapper />);

    fireEvent.click(screen.getByText("WiFi"));
    fireEvent.click(screen.getByText("AC"));
    fireEvent.click(screen.getByText("Parkir"));

    expect(screen.getByText("WiFi").closest("button")).toHaveClass(
      "bg-primary",
    );
    expect(screen.getByText("AC").closest("button")).toHaveClass(
      "bg-primary",
    );
    expect(screen.getByText("Parkir").closest("button")).toHaveClass(
      "bg-primary",
    );
  });
});
