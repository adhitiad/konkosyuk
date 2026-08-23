import { AppLayout } from "@/components/app-layout";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
