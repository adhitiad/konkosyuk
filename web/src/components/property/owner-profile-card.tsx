"use client";

import { CheckCircle2, User } from "lucide-react";

interface Owner {
  name: string;
  image: string | null;
  activeSince: Date | string;
  transactionCount: number;
}

interface OwnerProfileCardProps {
  owner: Owner | null;
  propertyId: string;
}

function formatActiveSince(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears > 0) return `${diffYears} tahun lalu`;
  if (diffMonths > 0) return `${diffMonths} bulan lalu`;
  return "Baru saja";
}

export function OwnerProfileCard({ owner, propertyId }: OwnerProfileCardProps) {
  if (!owner) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        {owner.image ? (
          <img
            src={owner.image}
            alt={owner.name}
            className="w-10 h-10 rounded-full object-cover bg-muted"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {owner.name}
          </p>
          <p className="text-xs text-muted-foreground">
            Aktif sejak {formatActiveSince(owner.activeSince)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        <span>{owner.transactionCount.toLocaleString()} transaksi berhasil</span>
      </div>

      <a
        href={`/owner/properties/${propertyId}`}
        className="block text-center text-xs text-primary hover:underline mt-1"
      >
        Lihat Semua Properti
      </a>
    </div>
  );
}
