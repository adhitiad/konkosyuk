import { HeroSection } from "@/components/landing/hero-section";
import { CategoriesSection } from "@/components/landing/categories-section";
import { FeaturedListingsSection } from "@/components/landing/featured-listings-section";
import { PopularCitiesSection } from "@/components/landing/popular-cities-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { FooterSection } from "@/components/landing/footer-section";
import { generateMetadata } from "@/app/[locale]/Metadata";

export const metadata = generateMetadata({
  params: Promise.resolve({ locale: "id" }),
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <CategoriesSection />
      <FeaturedListingsSection />
      <PopularCitiesSection />
      <FeaturesSection />
      <FooterSection />
    </main>
  );
}
