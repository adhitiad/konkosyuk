import { Navbar } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Metadata } from "next";
import { locales } from "@/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}`]),
      ) as Record<string, string>,
      "x-default": "/id",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}
