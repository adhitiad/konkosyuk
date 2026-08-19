"use client";

import { useOptimistic, useTransition } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { HeartIcon } from "@hugeicons/core-free-icons";
import { showToastError, showToastInfo } from "@/lib/use-toast-custom";
import { toggleWishlist } from "@/actions/wishlist";

interface FavoriteButtonClientProps {
  propertyId: string;
  initialFavorite?: boolean;
}

export default function FavoriteButtonClient({
  propertyId,
  initialFavorite = false,
}: FavoriteButtonClientProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [isFavorite, setIsFavorite] = useOptimistic(
    initialFavorite,
    (prev, newValue: boolean) => newValue,
  );

  const handleSubmit = (formData: FormData) => {
    formData.append("propertyId", propertyId);
    startTransition(async () => {
      const result = await toggleWishlist(undefined, formData);
      if (result?.success && result.favorited !== undefined) {
        setIsFavorite(result.favorited);
        showToastInfo(
          result.favorited ? "Ditambahkan ke favorit" : "Dihapus dari favorit",
        );
      } else if (result?.error) {
        showToastError(result.error);
        setIsFavorite(!isFavorite);
      }
    });
  };

  if (!session) {
    return null;
  }

  return (
    <form action={handleSubmit}>
      <Button type="submit" variant="ghost" size="icon-sm" disabled={isPending}>
        <HugeiconsIcon
          icon={HeartIcon}
          strokeWidth={2}
          className={`size-4 transition-colors ${isFavorite ? "text-red-500 fill-red-500" : "text-muted-foreground"}`}
        />
      </Button>
    </form>
  );
}
