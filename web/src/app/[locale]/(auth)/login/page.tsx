"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import type { SessionUserWithRole } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => false,
    () => true,
  );

  useEffect(() => {
    if (!isPending && session) {
      const user = session.user as unknown as SessionUserWithRole;
      if (user.role === "admin" || user.role === "staff") {
        router.push("/admin");
      } else if (user.role === "owner") {
        router.push("/owner");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Login gagal");
        return;
      }

      router.refresh();
    } catch {
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const callbackURL = `${window.location.origin}${window.location.pathname}?oauth=success`;
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
      if (result.error) {
        setError(result.error.message || "Login dengan Google gagal");
        setGoogleLoading(false);
      }
    } catch {
      setError("Login dengan Google gagal. Periksa konfigurasi OAuth Google.");
      setGoogleLoading(false);
    }
  };

  if (isPending && mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <CardHeader className="space-y-1 px-0 sm:px-6">
        <CardTitle className="text-2xl font-bold">
          Selamat Datang Kembali
        </CardTitle>
        <CardDescription>Masuk ke akun KonkosYuk Anda</CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="default"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
          >
            <Globe className="mr-2 h-4 w-4" />
            {googleLoading
              ? "Menghubungkan ke Google..."
              : "Lanjut dengan Google"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Atau lanjutkan dengan
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Daftar sekarang
            </Link>
          </p>
        </form>
      </CardContent>
    </AuthLayout>
  );
}
