"use client";

import { FormEvent, useState } from "react";
import { Link, useRouter } from "@/config";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui";
import { signIn, signUp } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleIcon } from "@hugeicons/core-free-icons";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { Spinner } from "@/components/ui/spinner";

const EMAIL_REGEX = /\S+@\S+\.\S+/;
const MIN_NAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;

interface PasswordValidation {
  valid: boolean;
  message: string;
}

function validatePassword(password: string): PasswordValidation {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter`,
    };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: "Password harus mengandung huruf" };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: "Password harus mengandung angka" };
  }
  return { valid: true, message: "" };
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('auth');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.length < MIN_NAME_LENGTH) {
      setError(`Nama lengkap minimal ${MIN_NAME_LENGTH} karakter`);
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError("Format email tidak valid");
      return;
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      setError(pwCheck.message);
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await signUp.email({
        email,
        password,
        name,
      });

      if (signUpError || !data) {
        showToastError(signUpError?.message || "Pendaftaran gagal. Silakan coba lagi.")
        setError(
          signUpError?.message || "Pendaftaran gagal. Silakan coba lagi.",
        );
        return;
      }

      showToastSuccess("Akun berhasil dibuat! Silakan login.")
      router.push({ pathname: '/login?registered=true' });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await signIn.social({
        provider: "google",
      });

      if (signInError || !data) {
        showToastError(signInError?.message || "Pendaftaran gagal. Silakan coba lagi.")
        setError(
          signInError?.message || "Pendaftaran gagal. Silakan coba lagi.",
        );
        return;
      }

      showToastSuccess("Akun berhasil dibuat! Silakan login.")
      router.push({ pathname: '/login?registered=true' });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun</CardTitle>
          <CardDescription>
            Buat akun baru untuk booking kost/kontrakan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={googleLoading || loading}
                onClick={handleGoogleSignIn}
              >
                {googleLoading ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={GoogleIcon}
                      strokeWidth={2}
                      className="size-4 mr-2"
                    />
                    Daftar dengan Google
                  </>
                )}
              </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Atau</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-y-4">
              <div className="grid gap-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={MIN_NAME_LENGTH}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  {MIN_PASSWORD_LENGTH === 8
                    ? "Password minimal 8 karakter, mengandung huruf, dan angka"
                    : `Password minimal ${MIN_PASSWORD_LENGTH} karakter`}
                </p>
              </div>
              <div className="grid gap-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  "Daftar"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Login di sini
                </Link>
              </p>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
