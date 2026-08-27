"use client";

import { useState, useEffect, useSyncExternalStore, useRef } from "react";
import Link from "next/link";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { linkReferralCode } from "@/actions/referrals";
import { toast } from "sonner";
import { z, flattenError } from "zod";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"cust" | "owner">("cust");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const refCodeRef = useRef<string | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => false,
    () => true,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      refCodeRef.current = ref;
    }
  }, []);

  const registerSchema = z.object({
    name: z.string().min(1, "Nama harus diisi"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
    agreedToPrivacy: z
      .boolean()
      .refine((val) => val === true, {
        message: "Anda harus menyetujui kebijakan privasi",
      }),
  });

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
    setFieldErrors({});

    const validationResult = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      agreedToPrivacy,
    });

    if (!validationResult.success) {
      const flattened = flattenError(validationResult.error);
      const errors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
        if (messages?.[0]) {
          errors[field] = messages[0];
        }
      }
      if (password !== confirmPassword) {
        errors.confirmPassword =
          "Password dan konfirmasi password tidak cocok";
      }
      setFieldErrors(errors);
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Password dan konfirmasi password tidak cocok" });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        setError(error.message || "Pendaftaran gagal");
        return;
      }

      if (refCodeRef.current && data?.user?.id) {
        const result = await linkReferralCode(refCodeRef.current);
        if (!result.success) {
          toast.error(result.error ?? "Gagal menghubungkan kode referral");
        }
      }

      router.push("/login?registered=1");
    } catch {
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const callbackURL = `${window.location.origin}${window.location.pathname}?oauth=success`;
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
      if (result.error) {
        setError(result.error.message || "Pendaftaran dengan Google gagal");
        setGoogleLoading(false);
      }
    } catch {
      setError(
        "Pendaftaran dengan Google gagal. Periksa konfigurasi OAuth Google.",
      );
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
          Daftar Akun KonkosYuk
        </CardTitle>
        <CardDescription>
          Buat akun untuk mulai mencari kost atau kontrakan
        </CardDescription>
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
            onClick={handleGoogleRegister}
            disabled={loading || googleLoading}
          >
            <Globe className="mr-2 h-4 w-4" />
            {googleLoading
              ? "Menghubungkan ke Google..."
              : "Daftar dengan Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                atau daftar dengan email
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={cn("pl-9", fieldErrors.name && "border-destructive")}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-sm text-destructive">{fieldErrors.name}</p>
            )}
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
                className={cn("pl-9", fieldErrors.email && "border-destructive")}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Daftar sebagai</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as "cust" | "owner")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cust">Penyewa</SelectItem>
                <SelectItem value="owner">Pemilik Kost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={cn("pl-9 pr-9", fieldErrors.password && "border-destructive")}
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
            {fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={cn("pl-9 pr-9", fieldErrors.confirmPassword && "border-destructive")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showConfirmPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="agreedToPrivacy"
              checked={agreedToPrivacy}
              onCheckedChange={(checked) => {
                setAgreedToPrivacy(checked === true);
                if (fieldErrors.agreedToPrivacy) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.agreedToPrivacy;
                    return next;
                  });
                }
              }}
              required
            />
            <Label
              htmlFor="agreedToPrivacy"
              className="cursor-pointer text-sm leading-tight"
            >
              Saya setuju data pribadi saya diproses sesuai{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline"
                target="_blank"
              >
                Tujuan Pemrosesan Data Pribadi dalam Kebijakan Privasi
              </Link>
            </Label>
          </div>
          {fieldErrors.agreedToPrivacy && (
            <p className="text-sm text-destructive -mt-2">
              {fieldErrors.agreedToPrivacy}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Masuk di sini
            </Link>
          </p>
        </form>
      </CardContent>
    </AuthLayout>
  );
}
