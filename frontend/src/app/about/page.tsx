import type { Metadata } from "next";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import {
  AboutHero,
  FoundationSection,
  DifferenceSection,
  PrinciplesSection,
  ResponsibleAISection,
  TechnologyFoundation,
  JourneyTimeline,
  ClinicalWorkflow,
  AboutFAQ,
  AboutCTA,
} from "@/components/about";
import { BRAND_CONFIG } from "@/config/brand";

export const metadata: Metadata = {
  title: "About | Intelligent Clinical Decision Support",
  description:
    "Learn how our healthcare AI and machine learning platform supports patient risk prediction, clinical intelligence, explainability, and human-centered decision support.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About | Intelligent Clinical Decision Support",
    description:
      "Learn how our healthcare AI and machine learning platform supports patient risk prediction, clinical intelligence, explainability, and human-centered decision support.",
    url: "/about",
    siteName: BRAND_CONFIG.brandName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: `${BRAND_CONFIG.brandName} About Page — Intelligent Clinical Decision Support`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About | Intelligent Clinical Decision Support",
    description:
      "Learn how our healthcare AI and machine learning platform supports patient risk prediction, clinical intelligence, explainability, and human-centered decision support.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased overflow-x-hidden">
      {/* 1. Universal Institutional Public Navbar */}
      <PublicNavbar />

      {/* 2. Structured Semantic About Page Sections */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <AboutHero />

        {/* Foundation: Vision, Mission, Purpose */}
        <FoundationSection />

        {/* What Makes Us Different & Bedside Clinical Mockup */}
        <DifferenceSection />

        {/* 6 Guiding Principles */}
        <PrinciplesSection />

        {/* Responsible AI by Design & Clinical Safety Invariants */}
        <ResponsibleAISection />

        {/* Technology Foundation & Multi-Tier Architecture */}
        <TechnologyFoundation />

        {/* Our Journey Horizontal/Vertical Timeline */}
        <JourneyTimeline />

        {/* Step-by-Step Clinical Intelligence Workflow */}
        <ClinicalWorkflow />

        {/* Accessible FAQ Accordion */}
        <AboutFAQ />

        {/* Final Pre-Footer Call to Action */}
        <AboutCTA />
      </main>

      {/* 3. Universal Institutional Public Footer */}
      <PublicFooter />
    </div>
  );
}
