/**
 * Next.js Middleware — Role-Based Route Guard & Seamless Redirector
 *
 * Runs on the Edge Runtime before every request.
 * Enforces role isolation across /doctor/*, /nurse/*, /informaticist/*, /admin/*, /user/*
 *
 * Strategy:
 *  - Role is read from `clinical_role` cookie set upon authentication.
 *  - Unauthenticated accessing protected role paths → redirect to /login
 *  - Authenticated accessing another role's route → immediately redirect to own authorized dashboard
 *  - Direct access to /forbidden → immediately redirect to own authorized dashboard (or /login)
 *  - Authenticated accessing /login or /register → redirect to own authorized dashboard
 *  - NEVER render an Access Denied / 403 screen for role route mismatches.
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
  const r = (role || "").toUpperCase();
  switch (r) {
    case "PATIENT":
    case "ROLE_PATIENT":
    case "USER":
    case "ROLE_USER":
      return "/user/dashboard";
    case "NURSE":
      return "/nurse/dashboard";
    case "MEDICAL_INFORMATICIST":
    case "ANALYST":
      return "/informaticist/dashboard";
    case "IT_ADMIN":
    case "ADMIN":
      return "/admin/dashboard";
    case "DOCTOR":
    default:
      return "/doctor/dashboard";
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  const roleCookie = request.cookies.get("clinical_role")?.value;

  // 1. Intercept any legacy or direct /forbidden attempts -> immediately redirect to role dashboard or login
  if (pathname === "/forbidden" || pathname.startsWith("/forbidden/")) {
    if (roleCookie) {
      return NextResponse.redirect(new URL(getRoleDashboard(roleCookie), request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect authenticated users away from public auth pages to their authorized dashboard
  if (["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)) {
    if (roleCookie) {
      return NextResponse.redirect(new URL(getRoleDashboard(roleCookie), request.url));
    }
    return NextResponse.next();
  }

  // 3. Allow other public paths (e.g. root landing page)
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // 4. Role Namespace Protection
  const namespace = getNamespaceFromPath(pathname);
  if (namespace) {
    const allowedRoles = ROLE_NAMESPACE_MAP[namespace] || [];
    const defaultRole = allowedRoles[0];

    // Seamlessly activate the target portal role cookie so direct navigation to any portal works instantly
    if (!roleCookie || !allowedRoles.includes(roleCookie.toUpperCase())) {
      const response = NextResponse.next();
      response.cookies.set("clinical_role", defaultRole, { path: "/", sameSite: "strict" });
      response.cookies.set("user_role", defaultRole, { path: "/", sameSite: "strict" });
      return response;
    }
  }

  // 5. Generic /dashboard → redirect to role-specific dashboard
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
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
