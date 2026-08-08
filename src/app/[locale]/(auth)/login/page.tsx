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
import {
  signIn,
  roleRedirectMap,
  type SessionUserWithRole,
  type Role,
} from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleIcon } from "@hugeicons/core-free-icons";
import { showToastSuccess, showToastError } from "@/lib/use-toast-custom";
import { Spinner } from "@/components/ui/spinner";

const EMAIL_REGEX = /\S+@\S+\.\S+/;
const MIN_PASSWORD_LENGTH = 6;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('auth');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t("emailRequired"));
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError(t("invalidEmail"));
      return;
    }
    if (!password) {
      setError(t("passwordRequired"));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("minPasswordLength", { min: MIN_PASSWORD_LENGTH }));
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await signIn.email({
        email,
        password,
      });

      if (signInError || !data) {
        showToastError(signInError?.message || t("loginError"))
        setError(signInError?.message || t("loginError"));
        return;
      }

      const fromSignIn = data.user as unknown as
        | SessionUserWithRole
        | undefined;
      let role: Role | undefined = fromSignIn?.role;

      const res = await fetch("/api/auth/get-session", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const session = (await res.json()) as {
          user?: { role?: string };
        };
        role = (session.user?.role as Role | undefined) ?? role;
      }

      router.push({ pathname: roleRedirectMap[role ?? "cust"] ?? "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    try {
      const { data, error: signInError }: { data: any; error: any } =
        await signIn.social({
          provider: "google",
        });

      if (signInError || !data) {
        showToastError(signInError?.message || t("loginError"))
        setError(signInError?.message || t("loginError"));
        return;
      }

      const fromSignIn = data.user as unknown as
        | SessionUserWithRole
        | undefined;
      let role: Role | undefined = fromSignIn?.role;

      const res = await fetch("/api/auth/get-session", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const session = (await res.json()) as {
          user?: { role?: string };
        };
        role = (session.user?.role as Role | undefined) ?? role;
      }

      router.push({ pathname: roleRedirectMap[role ?? "cust"] ?? "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginError"));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginDescription")}</CardDescription>
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
                    Masuk dengan Google
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
                <Label htmlFor="email">{t("email")}</Label>
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
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  t("loginButton")
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t("noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {t("registerLink")}
                </Link>
              </p>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
