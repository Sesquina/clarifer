import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://clarifer.com",
  "https://www.clarifer.com",
  "https://clarifer.vercel.app",
];

export function checkOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  // Same-origin requests have no Origin header — allow
  if (!origin) return null;
  // Allow listed origins
  if (ALLOWED_ORIGINS.includes(origin)) return null;
  // Allow localhost in development
  if (process.env.NODE_ENV === "development" && origin.startsWith("http://localhost")) return null;
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
