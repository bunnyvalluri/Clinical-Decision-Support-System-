import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

import { BRAND_CONFIG } from "@/config/brand";

export const metadata: Metadata = {
  metadataBase: new URL("https://clinical-decision-support-system-2026.vercel.app"),
  title: {
    default: `${BRAND_CONFIG.brandName} — ${BRAND_CONFIG.tagline}`,
    template: `%s | ${BRAND_CONFIG.brandName}`,
  },
  description: BRAND_CONFIG.description,
  applicationName: BRAND_CONFIG.brandName,
  authors: [{ name: `${BRAND_CONFIG.brandName} Engineering & Clinical Team` }],
  keywords: [
    "HealthNova AI",
    "Clinical Decision Support",
    "Patient Risk Intelligence",
    "Machine Learning",
    "Healthcare AI",
    "Explainable AI",
    "TreeSHAP",
    "Vital Signs Monitoring",
    "Hospital Telemetry",
  ],
  creator: BRAND_CONFIG.brandName,
  publisher: BRAND_CONFIG.brandName,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: `${BRAND_CONFIG.brandName} — ${BRAND_CONFIG.tagline}`,
    description: BRAND_CONFIG.description,
    siteName: BRAND_CONFIG.brandName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: `${BRAND_CONFIG.brandName} Clinical Decision Support`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_CONFIG.brandName} — ${BRAND_CONFIG.tagline}`,
    description: BRAND_CONFIG.description,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { PocketBaseProvider, AuxiliaryAnnouncementBanner } from "@/services/pocketbase";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PocketBaseProvider>
          <AuxiliaryAnnouncementBanner />
          {children}
        </PocketBaseProvider>
      </body>
    </html>
  );
}
