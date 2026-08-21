import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NearbyPlacesList } from "@/components/property/nearby-places-list";

describe("NearbyPlacesList", () => {
  const places = [
    { id: "1", name: "Warung Makan", type: "makanan", distance: 150, latitude: 0, longitude: 0 },
    { id: "2", name: "Minimarket", type: "belanja", distance: 80, latitude: 0, longitude: 0 },
    { id: "3", name: "Kampus", type: "pendidikan", distance: 1200, latitude: 0, longitude: 0 },
  ];

  it("displays all nearby places", () => {
    render(<NearbyPlacesList places={places} />);

    expect(screen.getByText("Warung Makan")).toBeInTheDocument();
    expect(screen.getByText("Minimarket")).toBeInTheDocument();
    expect(screen.getByText("Kampus")).toBeInTheDocument();
  });

  it("sorts places by distance (nearest first)", () => {
    render(<NearbyPlacesList places={places} />);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Minimarket");
    expect(items[1]).toHaveTextContent("Warung Makan");
    expect(items[2]).toHaveTextContent("Kampus");
  });

  it("formats distance correctly", () => {
    render(<NearbyPlacesList places={places} />);

    expect(screen.getByText("150m")).toBeInTheDocument();
    expect(screen.getByText("80m")).toBeInTheDocument();
    expect(screen.getByText("1.2km")).toBeInTheDocument();
  });

  it("calls onPlaceClick when clicked", () => {
    const onPlaceClick = vi.fn();
    render(<NearbyPlacesList places={places} onPlaceClick={onPlaceClick} />);

    fireEvent.click(screen.getByText("Minimarket"));
    expect(onPlaceClick).toHaveBeenCalledWith(places[1]);
  });

  it("displays empty message when places are empty", () => {
    render(<NearbyPlacesList places={[]} />);

    expect(screen.getByText("Belum ada tempat terdekat yang didaftarkan")).toBeInTheDocument();
  });
});
