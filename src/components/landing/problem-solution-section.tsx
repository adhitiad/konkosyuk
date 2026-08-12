import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ProblemSolutionSection() {
  return (
    <section className="bg-muted/30 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-2">
          <Card className="border-destructive/20 bg-destructive/5 p-8">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-xl font-semibold">Masalah yang Sering Dihadapi</h3>
            </div>
            <ul className="mt-6 space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-destructive/60" />
                Capek di-php-in calon penyewa?
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-destructive/60" />
                Khawatir uang DP dibawa lari?
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-destructive/60" />
                Sulit melacak pembayaran manual?
              </li>
            </ul>
          </Card>

          <Card className="border-primary/20 bg-primary/5 p-8">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="h-6 w-6" />
              <h3 className="text-xl font-semibold">Solusi dari KonkosYuk</h3>
            </div>
            <ul className="mt-6 space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                Sistem booking dengan DP 35% yang aman.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                Verifikasi KTP (KYC) ketat untuk semua pengguna.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                Laporan keuangan otomatis masuk ke rekening Anda.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}
