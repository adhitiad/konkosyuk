"use client";

import { useState, useActionState } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { HeartIcon } from "@hugeicons/core-free-icons";
import {
  showToastError,
  showToastInfo,
} from "@/lib/use-toast-custom";
import { toggleWishlist } from "@/actions/wishlist";

interface FavoriteButtonProps {
  propertyId: string;
  initialFavorite?: boolean;
}

export default function FavoriteButton({
  propertyId,
  initialFavorite = false,
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [state, formAction, isPending] = useActionState(
    toggleWishlist,
    undefined,
  );

  const handleSubmit = (formData: FormData) => {
    formData.append("propertyId", propertyId);
    formAction(formData);
  };

  if (state?.success && state.favorited !== undefined) {
    setIsFavorite(state.favorited);
    showToastInfo(
      state.favorited ? "Ditambahkan ke favorit" : "Dihapus dari favorit",
    );
  } else if (state?.error) {
    showToastError(state.error);
    setIsFavorite((prev) => !prev);
  }

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
