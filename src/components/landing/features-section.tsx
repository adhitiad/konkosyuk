import { MapPin, CalendarSync, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: MapPin,
    title: "Pencarian Berbasis Lokasi",
    text: "Temukan hunian dalam radius 1km dari kampus atau kantor Anda dengan akurasi GPS terverifikasi.",
  },
  {
    icon: CalendarSync,
    title: "Anti Double-Booking",
    text: "Sinkronisasi otomatis dengan platform lain. Kamar yang terbooking di tempat lain, otomatis terkunci di sini.",
  },
  {
    icon: ShieldCheck,
    title: "Pembayaran Terjamin",
    text: "Integrasi dengan Doku, iPaymu, dan Nicepay. Uang Anda aman hingga check-in.",
  },
];

export function FeaturesSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Mengapa Memilih <span className="text-primary">KonkosYuk</span>?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Kami menggabungkan teknologi dan keamanan untuk membuat pengguna sewa-menyewa
          menjadi lebih mudah, aman, dan transparan.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group h-full transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex flex-col gap-4 p-6">
                <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
