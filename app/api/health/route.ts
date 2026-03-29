import { NextRequest, NextResponse } from "next/server";
import { checkOrigin } from "@/lib/cors";

export async function GET(req: NextRequest) {
  const corsError = checkOrigin(req);
  if (corsError) return corsError;

  const warmup = req.nextUrl.searchParams.get("warmup");

  if (warmup) {
    const baseUrl = req.nextUrl.origin;
    const results: Record<string, string> = {};
    const endpoints = ["/api/chat", "/api/summarize"];

    await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        try {
          const res = await fetch(`${baseUrl}${endpoint}?warmup=1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ warmup: true }),
          });
          results[endpoint] = `${res.status}`;
        } catch {
          results[endpoint] = "error";
        }
      })
    );

    return NextResponse.json({ status: "warm", endpoints: results });
  }

  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
