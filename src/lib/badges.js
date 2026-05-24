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

  const markedPhrases = markedCells.map((c) => c.phrase);
  if (markedPhrases.includes("Serial Compounder"))
    earned.push("serial_compounder");
  if (markedPhrases.includes("Flywheel")) earned.push("flywheel");
  if (markedPhrases.includes("Filibuster")) earned.push("filibustered");
  if (markedPhrases.includes("Gonculator")) earned.push("gonculator");

  return earned;
}
