"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 text-center",
        className,
      )}
    >
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
      <Button onClick={onRetry} variant="outline">
        Coba Lagi
      </Button>
    </div>
  );
}
