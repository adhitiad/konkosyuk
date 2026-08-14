"use client";

import { useOptimistic, useActionState, startTransition } from "react";
import { Heart } from "lucide-react";
import { toggleWishlist, type ToggleWishlistState } from "@/actions/wishlist";

interface WishlistButtonProps {
  propertyId: string;
  initialFavorited: boolean;
}

export function WishlistButton({ propertyId, initialFavorited }: WishlistButtonProps) {
  const [state, formAction, pending] = useActionState<
    ToggleWishlistState,
    FormData
  >(toggleWishlist, {});

  const [optimisticFavorited, setOptimisticFavorited] = useOptimistic(
    initialFavorited,
    (current, newValue: boolean) => newValue,
  );

  const handleToggle = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("propertyId", propertyId);
      const result = await formAction(formData);
      if (result?.success && result.favorited !== undefined) {
        setOptimisticFavorited(result.favorited);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
      aria-label={optimisticFavorited ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`size-5 transition-colors ${
          optimisticFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"
        }`}
      />
      <span>{optimisticFavorited ? "Wishlisted" : "Add to Wishlist"}</span>
      {state?.error && <span className="text-xs text-red-500">{state.error}</span>}
    </button>
  );
}
