"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Cari kosan, alamat, atau nama...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, onSearch]);

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className={cn(
            "w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring/20",
          )}
        />
      </div>
    </div>
  );
}
