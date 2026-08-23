"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  TYPE_CHIPS,
  DURATION_CHIPS,
  GENDER_CHIPS,
  AMENITY_CHIPS,
  type FilterChip,
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
  labelKey,
  chips,
  activeValue,
  activeValues,
  onSingleSelect,
  onMultiToggle,
}: {
  labelKey: string;
  chips: readonly FilterChip[];
  activeValue?: string;
  activeValues?: string[];
  onSingleSelect?: (value: string | undefined) => void;
  onMultiToggle?: (value: string) => void;
}) {
  const t = useTranslations("filterChips");
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
    el.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {t(labelKey)}
      </span>
      <div className="relative">
        {canScrollLeft && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
            aria-label={t("scrollLeft")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-2 overflow-x-auto scrollbar-hide",
            "scroll-px-1 overscroll-x-contain",
          )}
          onScroll={checkScroll}
        >
          {chips?.map((chip) => {
            const isActive = onMultiToggle
              ? activeValues?.includes(chip.value as string)
              : activeValue === chip.value;

            return (
              <Button
                key={chip.labelKey}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (onMultiToggle) {
                    onMultiToggle(chip.value as string);
                  } else if (onSingleSelect) {
                    onSingleSelect(
                      activeValue === chip.value ? undefined : chip.value,
                    );
                  }
                }}
                className="shrink-0 rounded-full text-sm"
              >
                {t(chip.labelKey)}
              </Button>
            );
          })}
        </div>
        {canScrollRight && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
            aria-label={t("scrollRight")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
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
        labelKey="propertyType"
        chips={TYPE_CHIPS}
        activeValue={filters.type}
        onSingleSelect={handleTypeChange}
      />
      <ChipRow
        labelKey="duration"
        chips={DURATION_CHIPS}
        activeValue={filters.duration}
        onSingleSelect={handleDurationChange}
      />
      <ChipRow
        labelKey="gender"
        chips={GENDER_CHIPS}
        activeValue={filters.gender}
        onSingleSelect={handleGenderChange}
      />
      <ChipRow
        labelKey="amenities"
        chips={AMENITY_CHIPS}
        activeValues={filters.amenities}
        onMultiToggle={handleAmenityToggle}
      />
    </div>
  );
}
