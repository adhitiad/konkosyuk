import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  cn(
    "relative grid grid-cols-[auto_1fr] gap-x-3 items-start p-3 text-sm rounded-xl",
    "ring-1 ring-foreground/10",
  ),
  {
    variants: {
      variant: {
        default:
          "bg-input/30 text-foreground",
        destructive:
          "bg-destructive/10 text-destructive ring-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm leading-tight", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
