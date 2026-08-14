"use client";

import { AppLayout } from "@/components/app-layout";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/auth";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (
      !isPending &&
      (!session ||
        !["admin", "staff"].includes((session.user as any).role as Role))
    ) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  return <AppLayout role="admin">{children}</AppLayout>;
}
