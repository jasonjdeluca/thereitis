// Phrase bank (Hilton-only until DB-driven phrases are wired up via ingest pipeline).
// Tiers: hot (high confidence), warm (medium), cold (low — max 1-2 per card).
//
// TODO: replace with Supabase phrases query once phrases table is populated via
// ingest pipeline. See docs/PROJECT_INSTRUCTIONS.md "Pending Work" for steps.
// When wired, card.js must receive phrases as async input scoped to company_id.

export const HOT = [
  "Serial Compounder",
  "Brand-Led",
  "Network-Driven",
  "Platform-Enabled",
  "Flywheel",
  "Filibuster",
  "Never Say Never",
  "Long Long Time",
  "Early Days",
  "Network Effect",
  "White Space",
  "Shots on Goal",
  "I'd Take The Over",
  "Green Shoots",
  "C-Shaped Economy",
  "Don't Overcook It",
  "Above Algorithm",
  "Commercial Engine",
  "Conversion Rate",
  "Great Question",
  "Sneak One More In",
  "Unpack That",
  "Flow Through",
  "Rule Of Thumb",
  "In-Year For-Year",
  "Return Capital",
  "Asset-Light",
  "Chain Scales",
];

export const WARM = [
  "War Is War",
  "K Economy",
  "AI Complex",
  "Productivity Boom",
  "Middle Class",
  "Macro Tailwinds",
  "APAC Ex China",
  "Business Transient",
  "Leisure Transient",
  "Group Leading",
  "Development Outlook",
  "Organic Growth",
  "Tech Stack",
  "Deregulation",
  "Margin Expansion",
  "Fee Growth",
  "Loyalty Mix",
  "Owned And Leased",
];

export const COLD = [
  "Gonculator",
  "Unforeseen Circumstances",
  "I've Been Consistent",
  "Serial Acquirer",
  "Psychic",
];

export const TRINITY = ["Brand-Led", "Network-Driven", "Platform-Enabled"];
export const FILIBUSTER = "Filibuster";
export const FREE_LABEL = "FREE";

export const TIER = {
  hot: { dot: "🔥", points: 50, label: "hot" },
  warm: { dot: "⚡", points: 75, label: "warm" },
  cold: { dot: "❄️", points: 150, label: "cold" },
  free: { dot: "", points: 0, label: "free" },
};

export const CEO_MODE_PHRASES = [
  "Serial Compounder",
  "Flywheel",
  "Never Say Never",
  "Long Long Time",
  "Early Days",
  "Don't Overcook It",
  "Filibuster",
  "I'd Take The Over",
  "Green Shoots",
  "War Is War",
  "I've Been Consistent",
  "White Space",
  "Shots on Goal",
  "Network Effect",
  "Brand-Led",
  "Network-Driven",
  "Platform-Enabled",
];

export const CEO_TIER = {
  hot: { dot: "🔥", points: 50, label: "hot" },
  warm: { dot: "⚡", points: 75, label: "warm" },
  cold: { dot: "❄️", points: 150, label: "cold" },
  free: { dot: "", points: 0, label: "free" },
};

export const GREAT_QUESTION = "Great Question";
export const DONT_OVERCOOK = "Don't Overcook It";

export function tierOf(phrase) {
  if (HOT.includes(phrase)) return "hot";
  if (WARM.includes(phrase)) return "warm";
  if (COLD.includes(phrase)) return "cold";
  return "free";
}
