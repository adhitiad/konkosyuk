"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  TYPE_CHIPS,
  DURATION_CHIPS,
  GENDER_CHIPS,
  AMENITY_CHIPS,
} from "./filter-chips-config";

export interface FilterChips {
  type?: string;
  duration?: string;
  gender?: string;
  amenities: string[];
}

export interface FilterChipsBarProps {
  filters: FilterChips;
  onFilterChange: (filters: FilterChips) => void;
}

function ChipRow({
  label,
  chips,
  activeValue,
  activeValues,
  onSingleSelect,
  onMultiToggle,
}: {
  label: string;
  chips: readonly { value: string | undefined; label: string }[];
  activeValue?: string;
  activeValues?: string[];
  onSingleSelect?: (value: string | undefined) => void;
  onMultiToggle?: (value: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 200;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}
      </span>
      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-8 h-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-accent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-2 overflow-x-auto scrollbar-hide",
            "scrollbar-width: none; -webkit-overflow-scrolling: touch;",
          )}
          onScroll={checkScroll}
        >
          {chips.map((chip) => {
            const isActive = onMultiToggle
              ? activeValues?.includes(chip.value as string)
              : activeValue === chip.value;

            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  if (onMultiToggle) {
                    onMultiToggle(chip.value as string);
                  } else if (onSingleSelect) {
                    onSingleSelect(
                      activeValue === chip.value ? undefined : chip.value,
                    );
                  }
                }}
                className={cn(
                  "shrink-0 px-3 py-1.5 text-sm rounded-full border transition-all duration-200",
                  "hover:bg-accent hover:shadow-sm",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-8 h-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-accent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function FilterChipsBar({
  filters,
  onFilterChange,
}: FilterChipsBarProps) {
  const handleTypeChange = (value: string | undefined) => {
    onFilterChange({ ...filters, type: value });
  };

  const handleDurationChange = (value: string | undefined) => {
    onFilterChange({ ...filters, duration: value });
  };

  const handleGenderChange = (value: string | undefined) => {
    onFilterChange({ ...filters, gender: value });
  };

  const handleAmenityToggle = (value: string) => {
    const newAmenities = filters.amenities.includes(value)
      ? filters.amenities.filter((a) => a !== value)
      : [...filters.amenities, value];
    onFilterChange({ ...filters, amenities: newAmenities });
  };

  return (
    <div className="space-y-4 border-b border-border pb-4">
      <ChipRow
        label="Tipe Properti"
        chips={TYPE_CHIPS}
        activeValue={filters.type}
        onSingleSelect={handleTypeChange}
      />
      <ChipRow
        label="Durasi"
        chips={DURATION_CHIPS}
        activeValue={filters.duration}
        onSingleSelect={handleDurationChange}
      />
      <ChipRow
        label="Gender"
        chips={GENDER_CHIPS}
        activeValue={filters.gender}
        onSingleSelect={handleGenderChange}
      />
      <ChipRow
        label="Fasilitas"
        chips={AMENITY_CHIPS}
        activeValues={filters.amenities}
        onMultiToggle={handleAmenityToggle}
      />
    </div>
  );
}
