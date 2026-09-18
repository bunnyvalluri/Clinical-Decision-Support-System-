import type { Metadata } from "next";
import Script from "next/script";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import {
  SolutionsHero,
  SolutionsAudienceStrip,
  CoreSolutions,
  IndustrySolutions,
  RoleSolutionsTabs,
  HealthcareIntelligenceFlow,
  SolutionsRealResults,
  TrustedPartners,
  AIIntelligenceSection,
  ResponsibleSafetySection,
  SecurityPrivacySection,
  RealtimeIntelligenceSection,
  SolutionComparison,
  HealthcareWorkflowJourney,
  SolutionBenefits,
  ExampleWorkflows,
  SolutionsCTA,
  SolutionsFAQ,
} from "@/components/solutions";
import { BRAND_CONFIG } from "@/config/brand";

export const metadata: Metadata = {
  title: "Healthcare AI Solutions | HealthNova AI",
  description:
    "Explore HealthNova AI solutions for patient risk prediction, clinical decision support, healthcare analytics, real-time intelligence and AI-powered healthcare workflows.",
  alternates: {
    canonical: "/solutions",
  },
  openGraph: {
    title: "Healthcare AI Solutions | HealthNova AI",
    description:
      "Explore HealthNova AI solutions for patient risk prediction, clinical decision support, healthcare analytics, real-time intelligence and AI-powered healthcare workflows.",
    url: "/solutions",
    siteName: BRAND_CONFIG.brandName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/doctor-hero.jpg",
        width: 1200,
        height: 630,
        alt: `${BRAND_CONFIG.brandName} Solutions — Intelligent Healthcare Solutions for Better Outcomes`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Healthcare AI Solutions | HealthNova AI",
    description:
      "Explore HealthNova AI solutions for patient risk prediction, clinical decision support, healthcare analytics, real-time intelligence and AI-powered healthcare workflows.",
    images: ["/doctor-hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const solutionsJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://healthnova.ai/solutions#webpage",
      "url": "https://healthnova.ai/solutions",
      "name": "Healthcare AI Solutions | HealthNova AI",
      "description":
        "Explore HealthNova AI solutions for patient risk prediction, clinical decision support, healthcare analytics, real-time intelligence and AI-powered healthcare workflows.",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://healthnova.ai/",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Solutions",
            "item": "https://healthnova.ai/solutions",
          },
        ],
      },
    },
    {
      "@type": "MedicalWebPage",
      "@id": "https://healthnova.ai/solutions#medicalpage",
      "name": "HealthNova AI Clinical Intelligence & Solutions",
      "medicalAudience": [
        {
          "@type": "MedicalAudience",
          "audienceType": "Clinicians, Physicians, Nurses, Informaticists, Hospital Leadership",
        },
      ],
      "aspect": "Clinical Decision Support Systems, Predictive Patient Risk, Telemetry Intelligence",
    },
    {
      "@type": "FAQPage",
      "@id": "https://healthnova.ai/solutions#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How can HealthNova AI integrate with our existing systems?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "HealthNova AI supports bidirectional HL7 FHIR standards, DICOM messaging, and RESTful APIs, allowing smooth synchronization with major EHR platforms without replacing existing infrastructure.",
          },
        },
        {
          "@type": "Question",
          "name": "Does HealthNova AI replace healthcare professionals?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "No. HealthNova AI is strictly a clinical decision support system. Final diagnostic judgment, prescriptions, and care plans always remain the exclusive responsibility of licensed human clinicians.",
          },
        },
      ],
    },
  ],
};

export default function SolutionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-teal-500/20 selection:text-teal-900 font-sans antialiased overflow-x-hidden">
      {/* Schema.org Structured Data */}
      <Script
        id="solutions-schema-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(solutionsJsonLd) }}
      />

      {/* 1. Universal Institutional Public Header (Reused with Solutions active) */}
      <PublicNavbar />

      {/* 2. Structured Semantic Solutions Page Sections */}
      <main id="main-content" className="flex-1">
        {/* Section 1: Hero with Doctor Visual & 4 Floating Badges */}
        <SolutionsHero />

        {/* Section 2: Stakeholder Audience Strip */}
        <SolutionsAudienceStrip />

        {/* Section 3: Core Solutions (8 Grid Cards) */}
        <CoreSolutions />

        {/* Section 4: Solutions by Industry / Healthcare Environment (4 Cards) */}
        <IndustrySolutions />

        {/* Section 5: Role-Based Solutions (5 Interactive Tabs) */}
        <RoleSolutionsTabs />

        {/* Section 6: End-to-End Clinical Intelligence Flow (5 Steps) */}
        <HealthcareIntelligenceFlow />

        {/* Section 7: Real Results & Impact (Dr. Michael Chen Testimonial + 3 Metrics) */}
        <SolutionsRealResults />

        {/* Section 8: Trusted By Leading Healthcare Organizations */}
        <TrustedPartners />

        {/* Section 9: AI & Machine Learning Intelligence */}
        <AIIntelligenceSection />

        {/* Section 10: Responsible Intelligence by Design (Trust & Safety) */}
        <ResponsibleSafetySection />

        {/* Section 11: Security & Privacy Solutions */}
        <SecurityPrivacySection />

        {/* Section 12: Real-Time Event Pipeline */}
        <RealtimeIntelligenceSection />

        {/* Section 13: Solution Value & Comparison */}
        <SolutionComparison />

        {/* Section 14: Longitudinal Care Pathway Journey (7 Steps) */}
        <HealthcareWorkflowJourney />

        {/* Section 15: Key Benefits for Healthcare Delivery (6 Cards) */}
        <SolutionBenefits />

        {/* Section 16: Conceptual Clinical Scenarios (4 Example Workflows) */}
        <ExampleWorkflows />

        {/* Section 17: Ready to Get Started Wave Banner CTA */}
        <SolutionsCTA />

        {/* Section 18: Frequently Asked Questions Accordion */}
        <SolutionsFAQ />
      </main>

      {/* 3. Universal Institutional Public Footer (Reused) */}
      <PublicFooter />
    </div>
  );
}
