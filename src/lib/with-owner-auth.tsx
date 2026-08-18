"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { Role } from "@/lib/auth";

export function withOwnerAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: Role[] = ["owner"],
) {
  return function OwnerProtectedComponent(props: P) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    const userRole = (session?.user as { role?: string } | undefined)?.role;

useEffect(() => {
      if (!isPending) {
        if (!session) {
          router.push("/login");
        } else if (!userRole || !allowedRoles.includes(userRole as Role)) {
          router.push("/dashboard");
        }
      }
      
    }, [session, isPending, router, userRole]);

    return (
      <div suppressHydrationWarning>
        {isPending || !session ? (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !userRole || !allowedRoles.includes(userRole as Role) ? (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <WrappedComponent {...props} />
        )}
      </div>
    );
  };
}
