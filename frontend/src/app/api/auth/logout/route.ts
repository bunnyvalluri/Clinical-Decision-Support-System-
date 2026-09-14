import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  // Expire all auth and role cookies
  response.cookies.set("clinical_role", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("user_role", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("clinical_access_token", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("clinical_refresh_token", "", { path: "/", maxAge: 0, expires: new Date(0) });

  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL("/login?logout=true", "https://clinical-decision-support-system-20.vercel.app"));
  
  // Expire all auth and role cookies
  response.cookies.set("clinical_role", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("user_role", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("clinical_access_token", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("clinical_refresh_token", "", { path: "/", maxAge: 0, expires: new Date(0) });

  return response;
}
