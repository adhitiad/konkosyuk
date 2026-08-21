"use client";

import { ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapIcon, ListIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchPageSplitViewProps {
  children: ReactNode;
  mapContent?: ReactNode;
}

export function SearchPageSplitView({
  children,
  mapContent,
}: SearchPageSplitViewProps) {
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  if (isMobile) {
    return (
      <div>
        <div className="flex border-b border-border mb-4">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors",
              mobileView === "list"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground",
            )}
          >
            <ListIcon className="w-4 h-4 inline-block mr-1" />
            Daftar
          </button>
          <button
            type="button"
            onClick={() => setMobileView("map")}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition-colors",
              mobileView === "map"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground",
            )}
          >
            <MapIcon className="w-4 h-4 inline-block mr-1" />
            Peta
          </button>
        </div>
        {mobileView === "list" ? children : mapContent}
      </div>
    );
  }

  return (
    <div className="hidden md:flex md:h-[calc(100vh-4rem)]">
      <div className="w-[60%] overflow-y-auto border-r border-border">
        {children}
      </div>
      <div className="w-[40%] sticky top-16 h-[calc(100vh-4rem)]">
        {mapContent}
      </div>
    </div>
  );
}
