"use client";

import Image, { ImageProps } from "next/image";
import { getOptimizedImageUrl } from "@/lib/image-optimizer";

interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  size?: "thumbnail" | "card" | "detail" | "original";
}

export function OptimizedImage({
  src,
  size = "card",
  alt,
  ...props
}: OptimizedImageProps) {
  const optimizedSrc = getOptimizedImageUrl(src, size);

  const isCloudinary = optimizedSrc.includes("res.cloudinary.com");

  return (
    <Image
      src={optimizedSrc || "/placeholder-property.png"}
      alt={alt || "KonkosYuk Property"}
      unoptimized={isCloudinary}
      {...props}
    />
  );
}
