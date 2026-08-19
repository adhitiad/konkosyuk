import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersViewLoading() {
  return (
    <div className="container py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-64 w-full max-w-2xl mx-auto" />
    </div>
  );
}
