import { TRINITY, FILIBUSTER, FREE_LABEL, tierOf } from "./phrases.js";

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

function derivePools(phrases) {
  return {
    hot: phrases.filter((p) => p.tier === "hot").map((p) => p.phrase),
    warm: phrases.filter((p) => p.tier === "warm").map((p) => p.phrase),
    cold: phrases.filter((p) => p.tier === "cold").map((p) => p.phrase),
    ceo: phrases.filter((p) => p.ceo_mode).map((p) => p.phrase),
  };
}

// Build a tier lookup from DB phrases for use in cell construction.
function makeTierLookup(phrases) {
  if (!phrases || phrases.length === 0) return null;
  return new Map(phrases.map((p) => [p.phrase, p.tier]));
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

/**
 * @param {Array<{phrase: string, tier: string, ceo_mode: boolean}>} [phrases]
 *   DB phrase rows for the active company. Falls back to hardcoded arrays if omitted.
 */
export function generateCard(phrases) {
  const { hot, warm, cold } = derivePools(phrases);
  const tierLookup = makeTierLookup(phrases);
  const getTier = (phrase) => (tierLookup && tierLookup.get(phrase)) || tierOf(phrase);

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
  const hotPool = hot.filter((p) => !TRINITY.includes(p));
  const coldCount = Math.random() < 0.5 ? 1 : 2;
  const hotCount = 13;
  const warmCount = 21 - coldCount - hotCount; // 7 or 6

  const fillers = shuffle([
    ...pick(hotPool, hotCount),
    ...pick(warm, warmCount),
    ...pick(cold, coldCount),
  ]);

  let idx = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] !== null) continue;
      const phrase = fillers[idx++];
      grid[r][c] = {
        phrase,
        tier: getTier(phrase),
        isFree: false,
        isTrinity: false,
        isFilibuster: phrase === FILIBUSTER,
      };
    }
  }

  return grid;
}

/**
 * @param {Array<{phrase: string, tier: string, ceo_mode: boolean}>} [phrases]
 *   DB phrase rows for the active company. Falls back to hardcoded arrays if omitted.
 */
export function generateCeoCard(phrases) {
  const { hot, warm, cold, ceo } = derivePools(phrases);
  const tierLookup = makeTierLookup(phrases);
  const getTier = (phrase) => (tierLookup && tierLookup.get(phrase)) || tierOf(phrase);

  const grid = Array.from({ length: 5 }, () => Array(5).fill(null));

  grid[2][2] = {
    phrase: FREE_LABEL,
    tier: "free",
    isFree: true,
    isTrinity: false,
    isFilibuster: false,
  };

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

  const ceoFillers = shuffle(ceo.filter((p) => !TRINITY.includes(p)));

  const used = new Set([...TRINITY, ...ceoFillers]);
  const supplement = shuffle(
    [...hot, ...warm, ...cold].filter((p) => !used.has(p)),
  );

  const fillers = [...ceoFillers, ...supplement].slice(0, 21);

  let idx = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] !== null) continue;
      const phrase = fillers[idx++];
      grid[r][c] = {
        phrase,
        tier: getTier(phrase),
        isFree: false,
        isTrinity: false,
        isFilibuster: phrase === FILIBUSTER,
      };
    }
  }

  return grid;
}
