"use client";

import { useState, useActionState, useEffect } from "react";
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
import { reviewBookingAction } from "@/actions/bookings";

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
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [state, formAction, isPending] = useActionState(
    reviewBookingAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
      if (action === "approve") {
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
      setAction(null);
      setReason("");
      setError(null);
    } else if (state?.error) {
      setError(state.error);
    }
  }, [state, action, queryClient, unitName]);

  const handleAction = (selected: "approve" | "reject") => {
    if (selected === "reject" && !reason.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setError(null);
    setAction(selected);
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append(
      "status",
      selected === "approve" ? "confirmed" : "rejected",
    );
    if (selected === "reject") {
      formData.append("note", reason);
    }
    formAction(formData);
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
      onOpenChange={(open) => !open && isPending && setAction(null)}
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
              disabled={isPending}
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
                <Button type="button" variant="outline" disabled={isPending}>
                  Batal
                </Button>
              }
            />
            <Button
              variant="destructive"
              disabled={isPending || !reason.trim()}
              onClick={() => handleAction("reject")}
            >
              {isPending ? "Memproses..." : "Tolak Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
