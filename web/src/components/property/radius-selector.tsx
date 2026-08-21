"use client";

import { Button } from "@/components/ui/button";

const RADIUS_OPTIONS = [5, 10, 15, 30, 50];

interface RadiusSelectorProps {
  value: number;
  onChange: (radius: number) => void;
}

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground mr-1">Radius:</span>
      <div className="flex rounded-4xl border p-1">
        {RADIUS_OPTIONS.map((option) => (
          <Button
            key={option}
            variant={value === option ? "default" : "ghost"}
            size="icon-xs"
            onClick={() => onChange(option)}
            className="min-w-[2.5rem]"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
