"use client";

import { Suspense } from "react";
import { PropertyListSkeleton } from "@/components/ui/skeleton/property-skeletons";

interface PropertyListSuspenseProps {
  children: React.ReactNode;
  skeletonCount?: number;
}

export function PropertyListSuspense({
  children,
  skeletonCount = 6,
}: PropertyListSuspenseProps) {
  return (
    <Suspense fallback={<PropertyListSkeleton count={skeletonCount} />}>
      {children}
    </Suspense>
  );
}
