"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/axios";

interface ReviewBookingDialogProps {
  bookingId: string;
  propertyName: string;
  unitName: string;
  tenantName: string;
  children: React.ReactNode;
}

export default function ReviewBookingDialog({
  bookingId,
  propertyName,
  unitName,
  tenantName,
  children,
}: ReviewBookingDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      action,
      reason,
    }: {
      action: "approve" | "reject";
      reason?: string;
    }) => {
      const res = await apiClient.post(`/api/bookings/${bookingId}/review`, {
        status: action === "approve" ? "confirmed" : "rejected",
        note: reason,
      });
      if (res.status >= 400) {
        const text = res.data;
        throw new Error(text || "Gagal memproses review.");
      }
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      if (variables.action === "approve") {
        toast({
          title: "Booking diterima",
          description: `Booking untuk ${unitName} telah disetujui.`,
          type: "success",
        });
      } else {
        toast({
          title: "Booking ditolak",
          description: `Booking untuk ${unitName} telah ditolak.`,
          type: "info",
        });
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Gagal memproses review.");
    },
    onSettled: () => {
      setIsSubmitting(false);
      setAction(null);
      setReason("");
    },
  });

  const handleAction = (selected: "approve" | "reject") => {
    if (selected === "reject" && !reason.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setError(null);
    setAction(selected);
    setIsSubmitting(true);
    mutation.mutate({
      action: selected,
      reason: selected === "reject" ? reason : undefined,
    });
  };

  if (!action) {
    return (
      <Dialog>
        <DialogTrigger render={children as React.ReactElement} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm">
                <span className="font-medium">Tenant:</span> {tenantName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Properti:</span> {propertyName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Unit:</span> {unitName}
              </p>
            </div>
            {error && (
              <Alert variant="destructive">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  strokeWidth={2}
                  className="size-4"
                />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                }
              />
              <Button
                variant="destructive"
                onClick={() => handleAction("reject")}
              >
                Tolak
              </Button>
              <Button variant="default" onClick={() => handleAction("approve")}>
                Terima
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={action === "reject"}
      onOpenChange={(open) => !open && mutation.isPending && setAction(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alasan Penolakan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Alasan penolakan</Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Berikan alasan penolakan kepada tenant..."
              disabled={isSubmitting}
              className="w-full min-h-[80px] rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="size-4"
              />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Batal
                </Button>
              }
            />
            <Button
              variant="destructive"
              disabled={isSubmitting || !reason.trim()}
              onClick={() => handleAction("reject")}
            >
              {isSubmitting ? "Memproses..." : "Tolak Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
