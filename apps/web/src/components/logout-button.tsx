"use client";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export function LogoutButton() {
  async function handleLogout() {
     try {
       await signOut({
         fetchOptions: {
           onSuccess: () => {
             // eslint-disable-next-line @next/next/no-location-assign-relative-destination
             window.location.href = "/login";
           },
           onError: (ctx) => {
             console.error("Logout failed:", ctx.error);
             // eslint-disable-next-line @next/next/no-location-assign-relative-destination
             window.location.href = "/login";
           },
         },
       });
     } catch (err) {
       console.error("Logout error:", err);
       // eslint-disable-next-line @next/next/no-location-assign-relative-destination
       window.location.href = "/login";
     }
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={handleLogout}
    >
      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
      <span>Logout</span>
    </Button>
  );
}
