import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyRulesList } from "@/components/property/property-rules-list";

describe("PropertyRulesList", () => {
  const rules = [
    { id: "1", rule: "Tidak merokok", sortOrder: 1 },
    { id: "2", rule: "Tidak membawa hewan", sortOrder: 2 },
    { id: "3", rule: "Jam malam 22:00", sortOrder: 0 },
  ];

  it("displays all rules with check icon", () => {
    render(<PropertyRulesList rules={rules} />);

    expect(screen.getByText("Tidak merokok")).toBeInTheDocument();
    expect(screen.getByText("Tidak membawa hewan")).toBeInTheDocument();
    expect(screen.getByText("Jam malam 22:00")).toBeInTheDocument();
  });

  it("sorts rules by sortOrder", () => {
    render(<PropertyRulesList rules={rules} />);

    const list = screen.getByText("Tidak merokok").closest("ul");
    expect(list).toBeTruthy();
  });

  it("displays empty message when rules are empty", () => {
    render(<PropertyRulesList rules={[]} />);

    expect(screen.getByText("Belum ada peraturan")).toBeInTheDocument();
  });

  it("displays full rule text for each rule", () => {
    render(<PropertyRulesList rules={rules} />);

    rules.forEach((rule) => {
      expect(screen.getByText(rule.rule)).toBeInTheDocument();
    });
  });
});
