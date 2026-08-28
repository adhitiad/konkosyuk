import { redirect } from "next/navigation";

export default function RootPage() {
  // Ganti 'id' dengan locale default proyek Anda jika berbeda (misal: 'en')
  redirect("/id");
}
