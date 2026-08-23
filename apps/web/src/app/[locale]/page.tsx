import { HeroSection } from "@/components/landing/hero-section";
import { AdCarousel } from "@/components/landing/ad-carousel";
import { CategoriesSection } from "@/components/landing/categories-section";
import { FeaturedListingsSection } from "@/components/landing/featured-listings-section";
import { PopularCitiesSection } from "@/components/landing/popular-cities-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { FooterSection } from "@/components/landing/footer-section";
import { generateMetadata as generatePageMetadata } from "@/app/[locale]/Metadata";

// H-4 fix: gunakan params route dinamis, bukan hardcode "id"
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return generatePageMetadata({ params });
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
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
