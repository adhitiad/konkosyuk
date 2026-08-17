"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  ExternalLinkIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { approveKycAction } from "@/actions/admin/kyc";

interface KYCRequest {
  id: string;
  email: string;
  name: string;
  ktpNumber: string | null;
  ktpImageUrl: string | null;
  kycStatus: string;
  updatedAt: string;
  createdAt: string;
  verificationId: string | null;
  diditSessionId: string | null;
  verificationStatus: string | null;
  documentType: string | null;
  faceMatchScore: number | null;
  livenessPassed: boolean | null;
  rejectionReason: string | null;
  verificationCreatedAt: string | null;
  verificationUpdatedAt: string | null;
}

export default withAdminAuth(AdminKYCRequestsPage);

function AdminKYCRequestsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery<{
    data: KYCRequest[];
  }>({
    queryKey: ["admin-kyc-requests"],
    queryFn: async () => {
      const { data: json } = await apiClient.get("/api/admin/kyc/requests");
      return { data: json.data?.data };
    },
    staleTime: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      userId,
      action,
      adminNote,
    }: {
      userId: string;
      action: "verified" | "rejected";
      adminNote?: string;
    }) => {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("action", action);
      if (adminNote) formData.append("adminNote", adminNote);

      const result = await approveKycAction(undefined, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to update KYC");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-requests"] });
      toast({
        title: "KYC diperbarui",
        description: "Status KYC telah diubah.",
        type: "success",
      });
      setRejectUserId(null);
      setAdminNote("");
    },
    onError: (err) => {
      toast({
        title: "Gagal",
        description: err instanceof Error ? err.message : "Gagal mengubah KYC.",
        type: "error",
      });
    },
  });

  const requests: KYCRequest[] = Array.isArray(data?.data) ? data.data : [];

  // Use a stable timestamp from the component's mount/render to avoid impure function during render
  const renderTime = useRef(Date.now());

  useEffect(() => {
    renderTime.current = Date.now();
  }, []);

  const getWaitTime = (updatedAt: string) => {
    const diff = renderTime.current - new Date(updatedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    return `${hours} jam ${minutes % 60} menit`;
  };

  const isNearLimit = (updatedAt: string) => {
    const diff = renderTime.current - new Date(updatedAt).getTime();
    return diff > 20 * 60 * 1000;
  };

  const handleApprove = (userId: string) => {
    approveMutation.mutate({ userId, action: "verified" });
  };

  const handleReject = () => {
    if (!rejectUserId) return;
    if (!adminNote.trim()) {
      toast({
        title: "Alasan wajib diisi",
        description: "Silakan masukkan alasan penolakan.",
        type: "error",
      });
      return;
    }
    approveMutation.mutate({
      userId: rejectUserId,
      action: "rejected",
      adminNote: adminNote.trim(),
    });
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Permintaan KYC" },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight">Permintaan KYC</h1>
        <p className="text-muted-foreground">
          Verifikasi identitas owner yang menunggu
        </p>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Gagal memuat data permintaan KYC."}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Tidak ada permintaan KYC yang menunggu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request: KYCRequest) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    {request.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        isNearLimit(request.updatedAt)
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        strokeWidth={2}
                        className="mr-1 size-3"
                      />
                      {getWaitTime(request.updatedAt)}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{request.email}</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">NIK</p>
                    <p className="text-sm text-muted-foreground">
                      {request.ktpNumber || "-"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Preview Foto KTP</p>
                    {request.ktpImageUrl ? (
                      <img
                        src={request.ktpImageUrl}
                        alt="KTP"
                        className="h-32 w-auto rounded-lg border object-cover"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Tidak ada foto
                      </p>
                    )}
                  </div>
                </div>

                {request.diditSessionId && (
                  <div className="mt-4 p-4 rounded-xl border bg-muted/30">
                    <p className="text-sm font-medium mb-2">
                      Didit Verification
                    </p>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Session ID:
                        </span>
                        <span className="font-mono text-xs">
                          {request.diditSessionId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={
                            request.verificationStatus === "verified"
                              ? "default"
                              : request.verificationStatus === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {request.verificationStatus || "pending"}
                        </Badge>
                      </div>
                      {request.documentType && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Document:
                          </span>
                          <span>{request.documentType.toUpperCase()}</span>
                        </div>
                      )}
                      {request.faceMatchScore !== null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Face Match:
                          </span>
                          <span>{request.faceMatchScore}%</span>
                        </div>
                      )}
                      {request.livenessPassed !== null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Liveness:
                          </span>
                          <span>
                            {request.livenessPassed ? "Lulus" : "Tidak Lulus"}
                          </span>
                        </div>
                      )}
                      {request.rejectionReason && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded-lg">
                          <p className="text-xs text-destructive">
                            {request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={approveMutation.isPending}
                    onClick={() => handleApprove(request.id)}
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      strokeWidth={2}
                      className="mr-1 size-4"
                    />
                    {approveMutation.isPending ? "Memproses..." : "Verifikasi"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={approveMutation.isPending}
                    onClick={() => setRejectUserId(request.id)}
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      strokeWidth={2}
                      className="mr-1 size-4"
                    />
                    {approveMutation.isPending ? "Memproses..." : "Tolak"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!rejectUserId}
        onOpenChange={(open) => !open && setRejectUserId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Verifikasi KYC</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Masukkan alasan penolakan untuk memberitahu owner.
            </p>
            <Input
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Alasan penolakan..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectUserId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={approveMutation.isPending || !adminNote.trim()}
              onClick={handleReject}
            >
              {approveMutation.isPending ? "Memproses..." : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
