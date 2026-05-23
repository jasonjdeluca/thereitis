// Bingo line detection over a 5x5 grid.
// A line is fully marked if every cell on it is marked (FREE counts as marked).

export const LINES = (() => {
  const lines = [];
  for (let r = 0; r < 5; r++) {
    lines.push({
      key: `row-${r}`,
      kind: "row",
      cells: Array.from({ length: 5 }, (_, c) => [r, c]),
    });
  }
  for (let c = 0; c < 5; c++) {
    lines.push({
      key: `col-${c}`,
      kind: "col",
      cells: Array.from({ length: 5 }, (_, r) => [r, c]),
    });
  }
  lines.push({
    key: "diag-tl",
    kind: "diag",
    cells: [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ],
  });
  lines.push({
    key: "diag-tr",
    kind: "diag",
    cells: [
      [0, 4],
      [1, 3],
      [2, 2],
      [3, 1],
      [4, 0],
    ],
  });
  return lines;
})();

export function isMarked(grid, r, c) {
  const cell = grid[r][c];
  return cell.isFree || cell.marked;
}

// Returns { completed: [line keys], nearMiss: bool }
export function evaluate(grid) {
  const completed = [];
  let nearMiss = false;
  for (const line of LINES) {
    let marked = 0;
    for (const [r, c] of line.cells) if (isMarked(grid, r, c)) marked++;
    if (marked === 5) completed.push(line.key);
    else if (marked === 4) nearMiss = true;
  }
  return { completed, nearMiss };
}

export function isBlackout(grid) {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (!isMarked(grid, r, c)) return false;
    }
  }
  return true;
}

export function cellsOnLine(lineKey) {
  return LINES.find((l) => l.key === lineKey)?.cells || [];
}
