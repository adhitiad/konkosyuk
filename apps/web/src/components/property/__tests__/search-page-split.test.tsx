import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchPageSplitView } from "@/components/property/search-page-split";
import { useIsMobile } from "@/hooks/use-mobile";

vi.mock("@/hooks/use-mobile");

describe("SearchPageSplitView", () => {
  const mockUseIsMobile = vi.mocked(useIsMobile);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("desktop: renders both panels side by side", () => {
    mockUseIsMobile.mockReturnValue(false);

    render(
      <SearchPageSplitView mapContent={<div data-testid="map">Map</div>}>
        <div data-testid="list">List</div>
      </SearchPageSplitView>,
    );

    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.getByTestId("map")).toBeInTheDocument();
  });

  it("mobile: shows tab toggle", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SearchPageSplitView mapContent={<div data-testid="map">Map</div>}>
        <div data-testid="list">List</div>
      </SearchPageSplitView>,
    );

    expect(screen.getByText("Daftar")).toBeInTheDocument();
    expect(screen.getByText("Peta")).toBeInTheDocument();
  });

  it("mobile: defaults to list view", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SearchPageSplitView mapContent={<div data-testid="map">Map</div>}>
        <div data-testid="list">List</div>
      </SearchPageSplitView>,
    );

    expect(screen.getByTestId("list")).toBeInTheDocument();
  });

  it("mobile: clicking Peta tab switches to map view", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SearchPageSplitView mapContent={<div data-testid="map">Map</div>}>
        <div data-testid="list">List</div>
      </SearchPageSplitView>,
    );

    fireEvent.click(screen.getByText("Peta"));
    expect(screen.getByTestId("map")).toBeInTheDocument();
  });

  it("mobile: clicking Daftar tab switches back to list view", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SearchPageSplitView mapContent={<div data-testid="map">Map</div>}>
        <div data-testid="list">List</div>
      </SearchPageSplitView>,
    );

    fireEvent.click(screen.getByText("Peta"));
    expect(screen.getByTestId("map")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Daftar"));
    expect(screen.getByTestId("list")).toBeInTheDocument();
  });
});
