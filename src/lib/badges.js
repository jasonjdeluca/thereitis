import { TRINITY } from "./phrases";

export const BADGE_DEFS = {
  called_it: { name: "Called It", emoji: "🎉", desc: "You hit bingo" },
  blackout_artist: { name: "Blackout Artist", emoji: "⬛", desc: "You marked every square" },
  eagle_ears: { name: "Eagle Ears", emoji: "👂", desc: "10+ squares marked this session" },
  on_fire: { name: "On Fire", emoji: "🔥", desc: "5 squares marked in a row" },
  sniper: { name: "Sniper", emoji: "🎯", desc: "3 cold phrases marked in one session" },
  in_sync: { name: "In Sync", emoji: "🤝", desc: "5+ players marked the same square simultaneously" },
  psychic: { name: "Psychic", emoji: "🔮", desc: "All 3 pre-call predictions correct" },
  trinity: { name: "Trinity", emoji: "🔱", desc: "Brand-Led, Network-Driven, Platform-Enabled — all marked" },
  serial_compounder: { name: "Serial Compounder", emoji: "💰", desc: "You marked Serial Compounder" },
  flywheel: { name: "Flywheel", emoji: "🌀", desc: "You marked Flywheel" },
  filibustered: { name: "Filibustered", emoji: "🎙️", desc: "You marked Filibuster" },
  gonculator: { name: "Gonculator", emoji: "🧪", desc: "You marked the rarest square on the card" },
  retiring_risk: { name: "Retiring Risk", emoji: "🛫", desc: "You marked Boeing's signature deflection" },
  interconnected: { name: "Interconnected", emoji: "🔗", desc: "You marked Home Depot's omnichannel mantra" },
  revenue_growth_mgmt: { name: "RGM", emoji: "💹", desc: "You marked Coca-Cola's pricing framework" },
  roofing_granules: { name: "Roofing Granules", emoji: "🏠", desc: "You marked the most specific phrase on the card" },
  solventum_spin: { name: "Spin Doctor", emoji: "🔄", desc: "You marked 3M's healthcare spin-off" },
  shadow_factory: { name: "Shadow Factory", emoji: "🏭", desc: "You marked Boeing's rarest operations phrase" },
};

export function evaluateBadges({
  grid,
  didBingo,
  didBlackout,
  maxStreak,
  predictions,
  trinityFired,
  inSyncFired,
}) {
  const earned = [];
  const markedCells = [];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = grid[r][c];
      if (cell.marked && !cell.isFree) markedCells.push(cell);
    }
  }

  if (didBingo) earned.push("called_it");
  if (didBlackout) earned.push("blackout_artist");
  if (markedCells.length >= 10) earned.push("eagle_ears");
  if (maxStreak >= 5) earned.push("on_fire");

  const coldMarked = markedCells.filter((c) => c.tier === "cold");
  if (coldMarked.length >= 3) earned.push("sniper");

  if (inSyncFired) earned.push("in_sync");

  if (predictions && predictions.length === 3) {
    const markedPhrases = markedCells.map((c) => c.phrase);
    const correctCount = predictions.filter((p) =>
      markedPhrases.includes(p),
    ).length;
    if (correctCount === 3) earned.push("psychic");
  }

  if (trinityFired) earned.push("trinity");

  const markedLower = markedCells.map((c) => c.phrase.toLowerCase());
  if (markedLower.includes("serial compounder")) earned.push("serial_compounder");
  if (markedLower.includes("flywheel")) earned.push("flywheel");
  if (markedLower.includes("filibuster")) earned.push("filibustered");
  if (markedLower.includes("gonculator")) earned.push("gonculator");
  if (markedLower.includes("retiring risk")) earned.push("retiring_risk");
  if (markedLower.includes("shadow factory")) earned.push("shadow_factory");
  if (markedLower.includes("interconnected experience")) earned.push("interconnected");
  if (markedLower.includes("revenue growth management")) earned.push("revenue_growth_mgmt");
  if (markedLower.includes("roofing granules")) earned.push("roofing_granules");
  if (markedLower.includes("solventum spin") || markedLower.includes("spin of solventum")) earned.push("solventum_spin");

  return earned;
}
