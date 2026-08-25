import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnitTabs } from "@/components/property/unit-tabs";

describe("UnitTabs", () => {
  const units = [
    { id: "1", name: "Type A", type: "kamar", price: 1500000, roomSize: "3x4" },
    { id: "2", name: "Type B", type: "kamar", price: 2000000, roomSize: "4x4" },
    { id: "3", name: "Type C", type: "kamar", price: 2500000, roomSize: null },
  ];

  it("displays a button for each unit", () => {
    render(
      <UnitTabs units={units} selectedUnitId={null} onSelect={() => {}} />,
    );

    expect(screen.getByText("Type A")).toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();
  });

  it("applies primary style to selected unit", () => {
    render(<UnitTabs units={units} selectedUnitId="1" onSelect={() => {}} />);

    const selectedButton = screen.getByText("Type A").closest("button");
    expect(selectedButton).toHaveClass("bg-primary");
  });

  it("applies muted style to unselected units", () => {
    render(<UnitTabs units={units} selectedUnitId="1" onSelect={() => {}} />);

    const unselectedButton = screen.getByText("Type B").closest("button");
    expect(unselectedButton).toHaveClass("bg-muted");
  });

  it("displays name, short price, type, and roomSize", () => {
    render(
      <UnitTabs units={units} selectedUnitId={null} onSelect={() => {}} />,
    );

    const typeAButton = screen.getByRole("button", { name: /Type A/ });
    expect(typeAButton).toBeInTheDocument();
    expect(typeAButton).toHaveTextContent("1.5jt");
    expect(typeAButton).toHaveTextContent("3x4");

    const typeBButton = screen.getByRole("button", { name: /Type B/ });
    expect(typeBButton).toHaveTextContent("2jt");
    expect(typeBButton).toHaveTextContent("4x4");

    const typeCButton = screen.getByRole("button", { name: /Type C/ });
    expect(typeCButton).toHaveTextContent("2.5jt");
  });

  it("calls onSelect with correct id when clicked", () => {
    const onSelect = vi.fn();
    render(
      <UnitTabs units={units} selectedUnitId={null} onSelect={onSelect} />,
    );

    fireEvent.click(screen.getByText("Type B"));
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("renders horizontally scrollable container", () => {
    const { container } = render(
      <UnitTabs units={units} selectedUnitId={null} onSelect={() => {}} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("overflow-x-auto");
  });
});
