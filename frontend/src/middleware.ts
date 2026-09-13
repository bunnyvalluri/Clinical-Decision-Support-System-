/**
 * Next.js Middleware — Role-Based Route Guard
 *
 * Runs on the Edge Runtime before every request.
 * Enforces that /doctor/*, /nurse/*, /informaticist/*, /admin/*
 * are only accessible to users holding the correct role.
 *
 * Strategy:
 *  - Role is stored in localStorage (client) which is NOT accessible in
 *    Edge middleware. We persist the role in a cookie (`clinical_role`)
 *    set by the auth store on login. Middleware reads this cookie.
 *  - Unauthenticated → redirect to /login
 *  - Wrong role → redirect to /forbidden
 */

import { NextRequest, NextResponse } from "next/server";

const ROLE_NAMESPACE_MAP: Record<string, string[]> = {
  doctor: ["DOCTOR"],
  nurse: ["NURSE"],
  informaticist: ["MEDICAL_INFORMATICIST", "ANALYST"],
  admin: ["IT_ADMIN", "ADMIN"],
  user: ["PATIENT", "ROLE_PATIENT", "USER", "ROLE_USER"],
};

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/forbidden",
];

function getNamespaceFromPath(pathname: string): string | null {
  for (const ns of Object.keys(ROLE_NAMESPACE_MAP)) {
    if (pathname.startsWith(`/${ns}/`) || pathname === `/${ns}`) {
      return ns;
    }
  }
  return null;
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case "PATIENT":
    case "ROLE_PATIENT":
    case "USER":
    case "ROLE_USER":
      return "/user/dashboard";
    case "DOCTOR":
      return "/doctor/dashboard";
    case "NURSE":
      return "/nurse/dashboard";
    case "MEDICAL_INFORMATICIST":
    case "ANALYST":
      return "/informaticist/dashboard";
    case "IT_ADMIN":
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  const namespace = getNamespaceFromPath(pathname);

  // If navigating into a role namespace, check role cookie
  if (namespace) {
    const roleCookie = request.cookies.get("clinical_role")?.value;

    if (!roleCookie) {
      // Not authenticated → redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const allowedRoles = ROLE_NAMESPACE_MAP[namespace];
    if (!allowedRoles.includes(roleCookie)) {
      // Wrong role → redirect to /forbidden
      const forbiddenUrl = new URL("/forbidden", request.url);
      forbiddenUrl.searchParams.set("from", pathname);
      forbiddenUrl.searchParams.set("role", roleCookie);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // For /dashboard → redirect to role-specific dashboard
  if (pathname === "/dashboard") {
    const roleCookie = request.cookies.get("clinical_role")?.value;
    if (roleCookie) {
      return NextResponse.redirect(new URL(getRoleDashboard(roleCookie), request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions (.png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png).*)",
  ],
};
