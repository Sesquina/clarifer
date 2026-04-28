/**
 * lib/trials/who-ictrp-ingest.ts
 * Parses WHO ICTRP CSV export and upserts into who_ictrp_trials.
 * Tables: who_ictrp_trials (write, service role)
 * Auth: service role only -- never called from client
 * Sprint: Sprint 10 -- WHO ICTRP Pipeline
 *
 * HIPAA: No PHI. Public trial registry data only.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface IngestResult {
  inserted: number;
  updated: number;
  errors: string[];
}

type Row = Database["public"]["Tables"]["who_ictrp_trials"]["Insert"];

function serviceClient() {
  // Service role required: who_ictrp_trials RLS policy returns false for all
  // non-service callers. Ingest is admin-triggered and never client-side.
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Parses a single CSV line into fields. Handles double-quoted values that
 * contain commas. Does not handle backslash-escaped quotes (WHO ICTRP CSV
 * uses doubled quotes "" inside quoted fields, which is the standard
 * CSV-1.0 convention).
 */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ",") {
        out.push(cur);
        cur = "";
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

function findIndex(headers: string[], candidates: string[]): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const wanted = candidates.map(norm);
  for (let i = 0; i < headers.length; i++) {
    if (wanted.includes(norm(headers[i]))) return i;
  }
  return -1;
}

function parseDate(value: string): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

function splitCountries(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function rowToInsert(headers: string[], cells: string[]): Row | null {
  const idx = (names: string[]) => findIndex(headers, names);
  const get = (i: number) => (i >= 0 && i < cells.length ? cells[i].trim() : "");

  const trialId = get(idx(["TrialID", "trialid"]));
  const title = get(idx(["Public title", "publictitle", "title"]));
  if (!trialId || !title) return null;

  const condition = get(idx(["Condition"])) || null;
  const phase = get(idx(["Phase"])) || null;
  const countries = splitCountries(get(idx(["Countries", "Country"])));
  const status = get(idx(["Recruitment Status", "recruitmentstatus", "Status"])) || null;
  const primarySponsor = get(idx(["Primary Sponsor", "primarysponsor"])) || null;
  const dateReg = parseDate(get(idx(["Date of Registration", "dateofregistration"])));
  const url = get(idx(["URL", "Url"])) || null;

  const rawRow: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    rawRow[headers[i]] = cells[i] ?? "";
  }

  return {
    trial_id: trialId,
    title,
    condition,
    phase,
    countries: countries.length ? countries : null,
    status,
    sponsor: primarySponsor,
    primary_sponsor: primarySponsor,
    date_registration: dateReg,
    url,
    raw: rawRow,
  };
}

/**
 * Parses WHO ICTRP CSV text and upserts each row into who_ictrp_trials on
 * trial_id. Never throws; row-level failures land in the errors array so
 * the caller can report them without aborting the whole batch.
 */
export async function ingestWhoIctrpCsv(csvText: string): Promise<IngestResult> {
  const result: IngestResult = { inserted: 0, updated: 0, errors: [] };
  const text = (csvText ?? "").replace(/^﻿/, "");
  if (!text.trim()) {
    result.errors.push("empty CSV");
    return result;
  }

  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    result.errors.push("CSV has no data rows");
    return result;
  }

  const headers = parseCsvLine(lines[0]);
  const supabase = serviceClient();

  for (let r = 1; r < lines.length; r++) {
    const lineNo = r + 1;
    let cells: string[];
    let row: Row | null;
    try {
      cells = parseCsvLine(lines[r]);
      row = rowToInsert(headers, cells);
    } catch (err) {
      result.errors.push(`line ${lineNo}: parse failed (${err instanceof Error ? err.message : "unknown"})`);
      continue;
    }
    if (!row) {
      result.errors.push(`line ${lineNo}: missing TrialID or Public title`);
      continue;
    }

    try {
      const { data: existing } = await supabase
        .from("who_ictrp_trials")
        .select("id")
        .eq("trial_id", row.trial_id)
        .maybeSingle();
      const wasExisting = !!existing;

      const { error } = await supabase
        .from("who_ictrp_trials")
        .upsert(row, { onConflict: "trial_id" });
      if (error) {
        result.errors.push(`line ${lineNo}: ${error.message}`);
        continue;
      }
      if (wasExisting) result.updated += 1;
      else result.inserted += 1;
    } catch (err) {
      result.errors.push(`line ${lineNo}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return result;
}
