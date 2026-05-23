import { HOT, WARM, COLD, TRINITY, FILIBUSTER, FREE_LABEL, tierOf } from "./phrases.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

// 5x5 grid, FREE at [2][2].
// Trinity (Brand-Led, Network-Driven, Platform-Enabled) placed as 3 consecutive
// cells in a single row or column, avoiding the FREE square.
function trinityPlacements() {
  const placements = [];
  // Rows (skip row 2 because the FREE cell would interrupt the run)
  for (const r of [0, 1, 3, 4]) {
    for (let c = 0; c <= 2; c++) {
      placements.push([
        [r, c],
        [r, c + 1],
        [r, c + 2],
      ]);
    }
  }
  // Columns (skip col 2 for the same reason)
  for (const c of [0, 1, 3, 4]) {
    for (let r = 0; r <= 2; r++) {
      placements.push([
        [r, c],
        [r + 1, c],
        [r + 2, c],
      ]);
    }
  }
  return placements;
}

export function generateCard() {
  const grid = Array.from({ length: 5 }, () => Array(5).fill(null));

  // FREE center
  grid[2][2] = {
    phrase: FREE_LABEL,
    tier: "free",
    isFree: true,
    isTrinity: false,
    isFilibuster: false,
  };

  // Place Trinity
  const placements = trinityPlacements();
  const placement = placements[Math.floor(Math.random() * placements.length)];
  const trinityShuffled = shuffle(TRINITY);
  placement.forEach(([r, c], i) => {
    grid[r][c] = {
      phrase: trinityShuffled[i],
      tier: "hot",
      isFree: false,
      isTrinity: true,
      isFilibuster: trinityShuffled[i] === FILIBUSTER,
    };
  });

  // Remaining 21 cells: hot pool excluding Trinity, plus warm, plus 1-2 cold
  const hotPool = HOT.filter((p) => !TRINITY.includes(p));
  const coldCount = Math.random() < 0.5 ? 1 : 2;
  const hotCount = 13;
  const warmCount = 21 - coldCount - hotCount; // 7 or 6

  const fillers = shuffle([
    ...pick(hotPool, hotCount),
    ...pick(WARM, warmCount),
    ...pick(COLD, coldCount),
  ]);

  let idx = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] !== null) continue;
      const phrase = fillers[idx++];
      grid[r][c] = {
        phrase,
        tier: tierOf(phrase),
        isFree: false,
        isTrinity: false,
        isFilibuster: phrase === FILIBUSTER,
      };
    }
  }

  return grid;
}
