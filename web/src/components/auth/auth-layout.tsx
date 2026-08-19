import { Logo } from "@/components/ui/logo";
import { Card } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <div
        className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center p-12 relative overflow-hidden"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative z-10 max-w-md text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Sewa dan Kelola Properti dengan Aman, Transparan, dan Terjamin.
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            Temukan kost impian atau kelola properti Anda tanpa ribet. Semua
            dalam satu platform terpercaya.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-200">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              ✓ Verifikasi Lokasi
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              ✓ Pembayaran Aman
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              ✓ Anti Double Booking
            </span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="flex justify-center lg:justify-start mb-8">
            <Logo withText />
          </div>
          <Card className="border shadow-sm">{children}</Card>
        </div>
      </div>
    </div>
  );
}
