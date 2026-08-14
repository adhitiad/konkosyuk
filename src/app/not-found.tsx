import { HomeIcon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SearchXIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Halaman Tidak Ditemukan</CardTitle>
          <CardDescription>
            Ruko atau kost yang Anda cari tidak ditemukan. Mungkin sudah
            dihapus atau URL yang Anda masukkan salah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => (window.location.href = "/")}>
            <HomeIcon className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
