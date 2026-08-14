import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSolutionSection } from "@/components/landing/problem-solution-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FooterSection } from "@/components/landing/footer-section";
import { generateMetadata } from "@/app/[locale]/Metadata";

export const metadata = generateMetadata({
  params: Promise.resolve({ locale: "id" }),
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}
