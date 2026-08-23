import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomSpecsCard } from "@/components/property/room-specs-card";

describe("RoomSpecsCard", () => {
  it("displays room size when provided", () => {
    render(
      <RoomSpecsCard
        roomSize="3x4"
        electricityIncluded={true}
        furnitureIncluded={false}
      />,
    );

    expect(screen.getByText("Ukuran: 3x4")).toBeInTheDocument();
  });

  it("does not display room size when null", () => {
    render(
      <RoomSpecsCard
        roomSize={null}
        electricityIncluded={true}
        furnitureIncluded={false}
      />,
    );

    expect(screen.queryByText(/Ukuran:/)).not.toBeInTheDocument();
  });

  it("displays 'termasuk' when electricityIncluded is true", () => {
    render(
      <RoomSpecsCard
        roomSize={null}
        electricityIncluded={true}
        furnitureIncluded={false}
      />,
    );

    expect(screen.getByText("Listrik termasuk")).toBeInTheDocument();
  });

  it("displays 'belum termasuk' when electricityIncluded is false", () => {
    render(
      <RoomSpecsCard
        roomSize={null}
        electricityIncluded={false}
        furnitureIncluded={false}
      />,
    );

    expect(screen.getByText("Listrik belum termasuk")).toBeInTheDocument();
  });

  it("displays 'termasuk' when furnitureIncluded is true", () => {
    render(
      <RoomSpecsCard
        roomSize={null}
        electricityIncluded={false}
        furnitureIncluded={true}
      />,
    );

    expect(screen.getByText("Furnitur termasuk")).toBeInTheDocument();
  });

  it("displays icons for each row", () => {
    const { container } = render(
      <RoomSpecsCard
        roomSize="3x4"
        electricityIncluded={true}
        furnitureIncluded={false}
      />,
    );

    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(3);
  });
});
