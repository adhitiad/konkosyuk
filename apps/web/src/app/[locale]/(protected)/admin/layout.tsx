import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { locales } from "@/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/admin`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/admin`]),
      ) as Record<string, string>,
      "x-default": "/id/admin",
    } as Metadata["alternates"] & { "x-default": string },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSession(["admin", "staff"]);
  } catch {
    redirect("/login");
  }

  return children;
}
