import { test, expect } from "@playwright/test";
import { generateCard, generateCeoCard } from "../../src/lib/card.js";
import { CEO_TIER, TIER } from "../../src/lib/phrases.js";

const pipelinePhrases = Array.from({ length: 24 }, (_, index) => ({
  company_id: "hd",
  phrase: `pipeline phrase ${index + 1}`,
  tier: "standard",
  ceo_mode: true,
}));

function scoreMarkedTile(cell, tierTable) {
  return tierTable[cell.tier]?.points || 0;
}

test("C-1 non-Hilton standard-tier tile mark increments score", () => {
  const tile = generateCard(pipelinePhrases).flat().find((cell) => !cell.isFree);
  const scoreIncrement = scoreMarkedTile(tile, TIER);

  expect(tile.tier).toBe("standard");
  expect(TIER[tile.tier].dot).toBe("⚡");
  expect(scoreIncrement).toBe(75);
  expect(scoreIncrement).toBeGreaterThan(0);
});

test("C-1 CEO mode standard-tier tile mark increments score", () => {
  const tile = generateCeoCard(pipelinePhrases).flat().find((cell) => !cell.isFree);
  const scoreIncrement = scoreMarkedTile(tile, CEO_TIER);

  expect(tile.tier).toBe("standard");
  expect(scoreIncrement).toBe(75);
  expect(scoreIncrement).toBeGreaterThan(0);
});
