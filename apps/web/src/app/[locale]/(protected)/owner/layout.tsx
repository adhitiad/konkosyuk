import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSession(["owner"]);
  } catch {
    redirect("/login");
  }

  return children;
}
