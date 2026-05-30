#!/usr/bin/env node
// seed-companies.js — One-off: upsert Group F company rows into the companies table.
// Uses ignoreDuplicates so existing rows (hilton, ko, etc.) are never overwritten.
// NOTE: companies INSERT requires auth.role()='authenticated' via RLS.
// Run this with a service-role key or via Supabase MCP if the anon key fails.

import { getSupabase, log, logError } from "./lib/common.js";

const COMPANIES = [
  { id: "msft",  name: "Microsoft",             emoji: "💻" },
  { id: "aapl",  name: "Apple",                 emoji: "🍎" },
  { id: "nvda",  name: "NVIDIA",                emoji: "🎮" },
  { id: "jpm",   name: "JPMorgan Chase",         emoji: "🏦" },
  { id: "gs",    name: "Goldman Sachs",          emoji: "📈" },
  { id: "axp",   name: "American Express",       emoji: "💳" },
  { id: "v",     name: "Visa",                   emoji: "💳" },
  { id: "trv",   name: "Travelers",              emoji: "☂️" },
  { id: "unh",   name: "UnitedHealth Group",     emoji: "🏥" },
  { id: "amgn",  name: "Amgen",                  emoji: "🧬" },
  { id: "mrk",   name: "Merck",                  emoji: "💊" },
  { id: "pg",    name: "Procter & Gamble",       emoji: "🧴" },
  { id: "dis",   name: "Walt Disney",            emoji: "🎬" },
  { id: "amzn",  name: "Amazon",                 emoji: "📦" },
  { id: "crm",   name: "Salesforce",             emoji: "☁️" },
  { id: "ibm",   name: "IBM",                    emoji: "🖥️" },
  { id: "csco",  name: "Cisco",                  emoji: "🌐" },
  { id: "vz",    name: "Verizon",                emoji: "📡" },
  { id: "hst",   name: "Host Hotels & Resorts",  emoji: "🏨" },
  { id: "aple",  name: "Apple Hospitality REIT", emoji: "🏨" },
  { id: "pk",    name: "Park Hotels & Resorts",  emoji: "🏨" },
  { id: "rlj",   name: "RLJ Lodging Trust",      emoji: "🏨" },
];

async function main() {
  const supabase = getSupabase();

  const rows = COMPANIES.map(({ id, name, emoji }) => ({
    id,
    name,
    emoji,
    is_active: false,
  }));

  log(`Upserting ${rows.length} company rows (ignoreDuplicates: true) …`);

  const { data, error } = await supabase
    .from("companies")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    logError("Upsert failed:", error.message, error.code ?? "");
    process.exit(1);
  }

  const written = data?.length ?? 0;
  const skipped = rows.length - written;
  log(`  Rows upserted (new): ${written}`);
  log(`  Rows skipped (already existed): ${skipped}`);

  // Verify msft exists regardless of the upsert path.
  const { data: msftRow, error: verifyErr } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", "msft")
    .maybeSingle();

  if (verifyErr) {
    logError("msft verification query failed:", verifyErr.message);
    process.exit(1);
  }

  if (!msftRow) {
    logError("FATAL: msft row not found after upsert — aborting.");
    process.exit(1);
  }

  log(`  msft confirmed present: ${msftRow.id} / ${msftRow.name}`);
  log("seed-companies complete.");
}

main().catch((err) => {
  logError("Unexpected error:", err.message);
  process.exit(1);
});
