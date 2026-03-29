import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";
import { stripHtml } from "@/lib/sanitize";

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, location } = await request.json();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const sanitizedQuery = stripHtml(String(query));

  try {
    const params = new URLSearchParams({
      "query.cond": sanitizedQuery,
      pageSize: "10",
      "filter.overallStatus": "RECRUITING",
      format: "json",
    });

    if (location) {
      params.set("query.locn", stripHtml(String(location)));
    }

    const ctRes = await fetch(
      `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`,
      { next: { revalidate: 3600 } }
    );

    if (!ctRes.ok) {
      return NextResponse.json({ trials: [] });
    }

    const ctData = await ctRes.json();
    const studies = ctData.studies || [];

    const trials = studies.map((study: Record<string, unknown>) => {
      const protocol = study.protocolSection as Record<string, unknown> | undefined;
      const id = protocol?.identificationModule as Record<string, unknown> | undefined;
      const status = protocol?.statusModule as Record<string, unknown> | undefined;
      const design = protocol?.designModule as Record<string, unknown> | undefined;
      const desc = protocol?.descriptionModule as Record<string, unknown> | undefined;
      const contacts = protocol?.contactsLocationsModule as Record<string, unknown> | undefined;
      const locations = (contacts?.locations as Array<Record<string, unknown>>) || [];

      return {
        nctId: id?.nctId || "Unknown",
        title: id?.briefTitle || "Untitled",
        status: (status?.overallStatus as string) || "Unknown",
        phase: ((design?.phases as string[]) || []).join(", ") || "N/A",
        location: locations[0]
          ? `${(locations[0] as Record<string, unknown>).city || ""}, ${(locations[0] as Record<string, unknown>).state || ""}`
          : "Not specified",
        summary: ((desc?.briefSummary as string) || "").slice(0, 200),
      };
    });

    return NextResponse.json({ trials });
  } catch {
    return NextResponse.json({ trials: [] });
  }
}
