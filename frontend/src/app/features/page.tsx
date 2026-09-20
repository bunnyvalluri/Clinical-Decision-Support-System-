import type { Metadata } from "next";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import {
  FeaturesHero,
  CapabilityTrustStrip,
  FeatureHighlightCards,
  FeatureGrid,
  AIIntelligenceSection,
  RoleFeatures,
  MLWorkflow,
  RealTimeFeatures,
  SecurityFeatures,
  DataFlowVisual,
  FeaturesFAQ,
  FeaturesCTA,
} from "@/components/features";
import { BRAND_CONFIG } from "@/config/brand";

export const metadata: Metadata = {
  title: "Features | AI-Powered Clinical Decision Support",
  description:
    "Explore AI-powered clinical decision support, patient risk prediction, explainable machine learning, real-time healthcare intelligence, and secure clinical workflows.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features | AI-Powered Clinical Decision Support",
    description:
      "Explore AI-powered clinical decision support, patient risk prediction, explainable machine learning, real-time healthcare intelligence, and secure clinical workflows.",
    url: "/features",
    siteName: BRAND_CONFIG.brandName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: `${BRAND_CONFIG.brandName} Features — Intelligent Clinical Decision Support`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features | AI-Powered Clinical Decision Support",
    description:
      "Explore AI-powered clinical decision support, patient risk prediction, explainable machine learning, real-time healthcare intelligence, and secure clinical workflows.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased overflow-x-clip">
      {/* 1. Universal Institutional Public Navigation */}
      <PublicNavbar />

      {/* 2. Structured Semantic Features Page Sections */}
      <main id="main-content" className="flex-1">
        {/* Hero Section with Breadcrumb & Mobile Device Mockup */}
        <FeaturesHero />

        {/* Capability Trust Strip */}
        <CapabilityTrustStrip />

        {/* Two Feature Highlight Cards (Patient & Clinician) */}
        <FeatureHighlightCards />

        {/* 12 Powerful Features Grid */}
        <FeatureGrid />

        {/* AI-Powered Clinical Intelligence (Light Healthcare Aesthetic) */}
        <AIIntelligenceSection />

        {/* 5 Role-Specific Workspaces */}
        <RoleFeatures />

        {/* ML Care Pathway Pipeline & Models */}
        <MLWorkflow />

        {/* Real-Time Telemetry & Django Channels / Redis */}
        <RealTimeFeatures />

        {/* Security by Design & Governance */}
        <SecurityFeatures />

        {/* End-to-End System Data Flow Architecture */}
        <DataFlowVisual />

        {/* Frequently Asked Questions Accordion */}
        <FeaturesFAQ />

        {/* Final Pre-Footer Call to Action */}
        <FeaturesCTA />
      </main>

      {/* 3. Universal Institutional Public Footer */}
      <PublicFooter />
    </div>
  );
}
