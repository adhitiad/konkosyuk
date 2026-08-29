"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Role } from "@/lib/auth";

export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: Role[] = ["admin", "staff"],
) {
  return function AdminProtectedComponent(props: P) {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    const userRole = (session?.user as { role?: string } | undefined)?.role;

    useEffect(() => {
      if (!mounted) return;
      if (!isPending) {
        if (!session) {
          router.push("/login");
        } else if (!userRole || !allowedRoles.includes(userRole as Role)) {
          router.push("/dashboard");
        }
      }
    }, [session, isPending, router, userRole, mounted]);

    if (!mounted) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

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
