"use client";

import { AppLayout } from "@/components/app-layout";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/auth";
import { useEffect } from "react";
import type { SessionUserWithRole } from "@/lib/auth-client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    const userRole = (session?.user as SessionUserWithRole | undefined)?.role;
    if (
      !isPending &&
      (!session || !["admin", "staff"].includes(userRole as Role))
    ) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  return <AppLayout role="admin">{children}</AppLayout>;
}
