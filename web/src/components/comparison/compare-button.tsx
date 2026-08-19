"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { GitCompareIcon } from "@hugeicons/core-free-icons";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";

const MAX_COMPARE = 4;

function getComparisonState(propertyId: string) {
  if (typeof window === "undefined") return { isComparing: false, compareCount: 0 };
  try {
    const stored = localStorage.getItem("comparison_list");
    if (!stored) return { isComparing: false, compareCount: 0 };
    const ids = JSON.parse(stored) as string[];
    return {
      isComparing: ids.includes(propertyId),
      compareCount: ids.length,
    };
  } catch {
    return { isComparing: false, compareCount: 0 };
  }
}

export function CompareButton({ propertyId }: { propertyId: string }) {
  const [isComparing, setIsComparing] = useState(() => {
    const { isComparing } = getComparisonState(propertyId);
    return isComparing;
  });
  const [compareCount, setCompareCount] = useState(() => {
    const { compareCount } = getComparisonState(propertyId);
    return compareCount;
  });

  const syncState = useCallback(() => {
    const { isComparing, compareCount } = getComparisonState(propertyId);
    setIsComparing(isComparing);
    setCompareCount(compareCount);
  }, [propertyId]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "comparison_list") {
        syncState();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [syncState]);

  const toggleCompare = () => {
    const stored = localStorage.getItem("comparison_list");
    let ids: string[] = [];
    if (stored) {
      try {
        ids = JSON.parse(stored) as string[];
      } catch {}
    }

    if (isComparing) {
      const newIds = ids.filter((id) => id !== propertyId);
      localStorage.setItem("comparison_list", JSON.stringify(newIds));
      setIsComparing(false);
      setCompareCount(newIds.length);
    } else {
      if (ids.length >= MAX_COMPARE) {
        showToastError(`Maksimal ${MAX_COMPARE} properti untuk perbandingan`);
        return;
      }
      ids.push(propertyId);
      localStorage.setItem("comparison_list", JSON.stringify(ids));
      setIsComparing(true);
      setCompareCount(ids.length);
      showToastSuccess("Properti ditambahkan ke perbandingan");
    }
  };

  return (
    <Button
      variant={isComparing ? "default" : "outline"}
      size="sm"
      onClick={toggleCompare}
      className="gap-1.5"
    >
      <HugeiconsIcon icon={GitCompareIcon} strokeWidth={2} className="size-4" />
      {isComparing ? "Bandingkan" : "Bandingkan"}
      {compareCount > 0 && (
        <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs">
          {compareCount}
        </span>
      )}
    </Button>
  );
}
