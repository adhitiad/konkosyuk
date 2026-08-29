import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSession();
  } catch {
    redirect("/login");
  }

  return <AppLayout>{children}</AppLayout>;
}
