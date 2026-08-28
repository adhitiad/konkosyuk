import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unauthorized",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="mb-4 text-4xl font-bold text-red-600">403</h1>
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">
          Akses Dilarang
        </h2>
        <p className="mb-6 text-gray-600">
          Anda tidak memiliki izin untuk mengakses halaman ini. Hanya admin yang
          dapat melihat dashboard ini.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-lg bg-gray-200 px-6 py-2 text-gray-800 transition-colors hover:bg-gray-300"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Login dengan Akun Admin
          </Link>
        </div>
      </div>
    </div>
  );
}