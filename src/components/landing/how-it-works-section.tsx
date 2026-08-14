import { UserPlus, Upload, Wallet } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Daftar & Verifikasi KTP",
    description:
      "Buat akun dan verifikasi identitas Anda dengan KTP untuk keamanan bersama.",
  },
  {
    icon: Upload,
    title: "Upload Foto & Setel Harga",
    description:
      "Unggah foto properti, atur harga sewa, dan kelola ketersediaan kamar.",
  },
  {
    icon: Wallet,
    title: "Terima Pembayaran Otomatis",
    description:
      "Pembayaran DP dan cicilan otomatis masuk ke rekening Anda tanpa ribet.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-muted/30 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Mulai Hanya dalam <span className="text-primary">3 Langkah</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Proses pendaftaran dan pengelolaan properti di KonkosYuk dirancang
          sesederhana mungkin.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="hidden sm:block">
                  <div className="absolute left-1/2 top-10 h-0.5 w-3/4 -translate-x-1/2 bg-border" />
                </div>
              )}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
