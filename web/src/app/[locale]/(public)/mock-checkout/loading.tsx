import { Skeleton } from "@/components/ui/skeleton";

export default function MockCheckoutLoading() {
  return (
    <div className="container py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
    </div>
  );
}
