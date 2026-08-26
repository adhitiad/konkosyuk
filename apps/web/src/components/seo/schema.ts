import { Metadata } from "next";
import { locales } from "@/config";

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
  "https://konkosyuk.com";

export const SITE_NAME = "KonkosYuk";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const alternatesFor = (path: string): Metadata["alternates"] => {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `/${locale}${path}`;
  }

  return {
    canonical: `/id${path}`,
    languages,
    "x-default": `/id${path}`,
  } as Metadata["alternates"] & { "x-default": string };
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Platform booking kost dan kontrakan terpercaya dengan sistem DP 35%",
  sameAs: [] as string[],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@konkosyuk.com",
    availableLanguage: ["Indonesian", "English"],
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Platform booking kost dan kontrakan terpercaya dengan sistem DP 35%",
  inLanguage: "id-ID",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/id/properties?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const faqSchema = (items: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});
