"use client";

import { HeroSection } from "@/components/landing/hero-section";
import { PopularAreasSection } from "@/components/landing/popular-areas-section";
import { CampusAreasSection } from "@/components/landing/campus-areas-section";
import { CategoriesSection } from "@/components/landing/categories-section";
import { FeaturedListingsSection } from "@/components/landing/featured-listings-section";
import { FooterSection } from "@/components/landing/footer-section";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <PopularAreasSection />
      <CampusAreasSection />
      <CategoriesSection />
      <FeaturedListingsSection />
      <FooterSection />
    </div>
  );
}
