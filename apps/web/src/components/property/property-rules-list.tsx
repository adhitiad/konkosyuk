"use client";

import { ClipboardList, CheckCircle2 } from "lucide-react";

interface PropertyRule {
  id: string;
  rule: string;
  sortOrder: number;
}

interface PropertyRulesListProps {
  rules: PropertyRule[];
}

export function PropertyRulesList({ rules }: PropertyRulesListProps) {
  const sortedRules = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-muted-foreground" />
        Peraturan di Kos Ini
      </h3>
      {sortedRules.length > 0 ? (
        <ul className="space-y-1.5">
          {sortedRules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{rule.rule}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Belum ada peraturan
        </p>
      )}
    </div>
  );
}
