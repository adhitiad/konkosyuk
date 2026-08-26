import { HeroSection } from "@/components/landing/hero-section";
import { AdCarousel } from "@/components/landing/ad-carousel";
import { CategoriesSection } from "@/components/landing/categories-section";
import { FeaturedListingsSection } from "@/components/landing/featured-listings-section";
import { PopularCitiesSection } from "@/components/landing/popular-cities-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { FooterSection } from "@/components/landing/footer-section";
import { JsonLd } from "@/components/seo/json-ld";
import { generateMetadata as generatePageMetadata } from "@/app/[locale]/Metadata";
import { SITE_URL } from "@/components/seo/schema";

// H-4 fix: gunakan params route dinamis, bukan hardcode "id"
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return generatePageMetadata({ params });
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Kost",
          url: `${SITE_URL}/${locale}/properties?type=kost`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Kontrakan",
          url: `${SITE_URL}/${locale}/properties?type=kontrakan`,
        },
      ],
    },
  ];

  return (
    <main className="flex min-h-screen flex-col">
      <JsonLd data={jsonLd} />
      <HeroSection />
      <AdCarousel />
      <CategoriesSection />
      <FeaturedListingsSection />
      <PopularCitiesSection />
      <FeaturesSection />
      <FooterSection />
    </main>
  );
}
