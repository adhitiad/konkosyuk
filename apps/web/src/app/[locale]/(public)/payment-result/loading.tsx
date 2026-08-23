import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentResultLoading() {
  return (
    <div className="container py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="max-w-md mx-auto space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto text-center" />
        <Skeleton className="h-4 w-64 mx-auto text-center" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
