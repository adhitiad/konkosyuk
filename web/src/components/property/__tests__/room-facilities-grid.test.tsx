import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomFacilitiesGrid } from "@/components/property/room-facilities-grid";

describe("RoomFacilitiesGrid", () => {
  it("displays 3 categories when all have data", () => {
    render(
      <RoomFacilitiesGrid
        facilities={{
          kamar: [{ name: "AC", icon: "wind" }],
          kamar_mandi: [{ name: "Shower", icon: "shower-head" }],
          umum: [{ name: "WiFi", icon: "wifi" }],
        }}
      />,
    );

    expect(screen.getByText("Fasilitas Kamar")).toBeInTheDocument();
    expect(screen.getByText("Fasilitas Kamar Mandi")).toBeInTheDocument();
    expect(screen.getByText("Fasilitas Umum")).toBeInTheDocument();
  });

  it("does not display empty categories", () => {
    render(
      <RoomFacilitiesGrid
        facilities={{
          kamar: [{ name: "AC", icon: "wind" }],
          kamar_mandi: [],
          umum: [],
        }}
      />,
    );

    expect(screen.getByText("Fasilitas Kamar")).toBeInTheDocument();
    expect(screen.queryByText("Fasilitas Kamar Mandi")).not.toBeInTheDocument();
    expect(screen.queryByText("Fasilitas Umum")).not.toBeInTheDocument();
  });

  it("displays icon and name for each facility", () => {
    render(
      <RoomFacilitiesGrid
        facilities={{
          kamar: [{ name: "AC", icon: "wind" }],
        }}
      />,
    );

    expect(screen.getByText("AC")).toBeInTheDocument();
  });

  it("does not crash when icon is missing", () => {
    render(
      <RoomFacilitiesGrid
        facilities={{
          kamar: [{ name: "Unknown", icon: "nonexistent-icon" }],
        }}
      />,
    );

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("returns null when all categories are empty", () => {
    const { container } = render(
      <RoomFacilitiesGrid
        facilities={{
          kamar: [],
          kamar_mandi: [],
          umum: [],
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders grid with responsive columns", () => {
    const { container } = render(
      <RoomFacilitiesGrid
        facilities={{
          kamar: [{ name: "AC", icon: "wind" }],
        }}
      />,
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-3");
    expect(grid).toHaveClass("sm:grid-cols-4");
  });
});
