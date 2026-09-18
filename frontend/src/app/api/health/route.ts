import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const uptime = process.uptime();
  return NextResponse.json(
    {
      status: "healthy",
      service: "healthnova-frontend",
      environment: process.env.NODE_ENV || "production",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(uptime),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    }
  );
}
