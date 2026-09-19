/**
 * Centralized Public Navigation Configuration
 *
 * Single source of truth for public navigation links, routes, and active states.
 */

export interface NavLinkItem {
  name: string;
  href: string;
  description?: string;
}

export const PUBLIC_NAV_LINKS: NavLinkItem[] = [
  { name: "Home", href: "/", description: "Platform Landing & Bedside Simulator" },
  { name: "About", href: "/about", description: "Mission, Architecture & Clinical Governance" },
  { name: "Features", href: "/features", description: "AI/ML Capabilities & Healthcare Intelligence" },
  { name: "Solutions", href: "/solutions", description: "Integrated Care Pathways & Workflows" },
  { name: "Contact", href: "/contact", description: "Dr. Vadla Abhinay, MD Profile & Clinical Inquiries" },
];

export const PUBLIC_NAV_ACTIONS = {
  signIn: { name: "Sign In", href: "/login" },
  register: { name: "Register", href: "/register" },
  launchPortal: { name: "Launch Portal", href: "/dashboard" },
};
