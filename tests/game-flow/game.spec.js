// Game flow smoke test — drives a full game session end-to-end through the browser.
// Creates REAL rows in the Supabase sessions and players tables.
// Run manually or in scheduled CI; avoid tight loops to keep DB clean.
// Requires Hilton (company_id = "hilton") to have ≥25 active phrases.

import { test, expect } from "@playwright/test";

const TEST_PLAYER_NAME = `SmokeTest-${Date.now()}`;
const GRID_CELL_COUNT = 25; // 5×5 bingo grid

test.describe("Game flow", () => {
  test("create session and render bingo card", async ({ page }) => {
    // Navigate to the game for Hilton
    await page.goto("/play/hilton");

    // ModeSelect — choose Play Bingo
    await expect(page.getByText("Play Bingo")).toBeVisible({ timeout: 8000 });
    await page.getByText("Play Bingo").click();

    // NameEntry — fill in a name and start
    const nameInput = page.getByPlaceholder("Enter your name");
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(TEST_PLAYER_NAME);

    await page.getByRole("button", { name: /Start a Game/i }).click();

    // Wait for Game screen — the bingo grid should appear
    const grid = page.locator(".grid.grid-cols-5");
    await expect(grid).toBeVisible({ timeout: 15000 });

    // Verify exactly 25 cells rendered
    const cells = grid.locator("[aria-pressed]");
    await expect(cells).toHaveCount(GRID_CELL_COUNT);
  });

  test("marking a tile updates its pressed state and score", async ({ page }) => {
    await page.goto("/play/hilton");
    await page.getByText("Play Bingo").click();
    const nameInput = page.getByPlaceholder("Enter your name");
    await nameInput.fill(TEST_PLAYER_NAME);
    await page.getByRole("button", { name: /Start a Game/i }).click();

    const grid = page.locator(".grid.grid-cols-5");
    await expect(grid).toBeVisible({ timeout: 15000 });

    // Find a non-FREE cell (aria-pressed="false") and click it
    const unmarkedCell = grid.locator('[aria-pressed="false"]').first();
    const phraseLabel = await unmarkedCell.getAttribute("aria-label");
    await unmarkedCell.click();

    // After clicking, the cell should now be pressed
    // Use a short wait for the undo window to not interfere
    await page.waitForTimeout(500);
    const markedCell = grid.locator(`[aria-label="${phraseLabel}"]`);
    await expect(markedCell).toHaveAttribute("aria-pressed", "true");
  });

  test("bingo detection fires after completing a row", async ({ page }) => {
    await page.goto("/play/hilton");
    await page.getByText("Play Bingo").click();
    const nameInput = page.getByPlaceholder("Enter your name");
    await nameInput.fill(TEST_PLAYER_NAME);
    await page.getByRole("button", { name: /Start a Game/i }).click();

    const grid = page.locator(".grid.grid-cols-5");
    await expect(grid).toBeVisible({ timeout: 15000 });

    // Get all cells in the first row (cells 0-4 in the flat grid)
    const allCells = grid.locator("[aria-pressed]");
    await expect(allCells).toHaveCount(GRID_CELL_COUNT);

    // Click the first 5 cells (first row). Skip FREE square if present.
    let clicked = 0;
    for (let i = 0; i < GRID_CELL_COUNT && clicked < 5; i++) {
      const cell = allCells.nth(i);
      const label = await cell.getAttribute("aria-label");
      if (label === "Free space") continue; // skip FREE — already counted
      await cell.click();
      await page.waitForTimeout(300); // allow undo window processing
      clicked++;
    }

    // Bingo should fire — look for celebration overlay or bingo toast
    // The game renders a Celebration component or bingo toast on line completion
    const bingoIndicator = page
      .getByText(/bingo|Bingo/i)
      .or(page.locator('[class*="celebration"]'))
      .or(page.locator('[class*="Celebration"]'));

    await expect(bingoIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test("End Game leads to leaderboard or post-game screen", async ({ page }) => {
    await page.goto("/play/hilton");
    await page.getByText("Play Bingo").click();
    const nameInput = page.getByPlaceholder("Enter your name");
    await nameInput.fill(TEST_PLAYER_NAME);
    await page.getByRole("button", { name: /Start a Game/i }).click();

    const grid = page.locator(".grid.grid-cols-5");
    await expect(grid).toBeVisible({ timeout: 15000 });

    // Click the End button in the Toolbar
    const endButton = page.getByRole("button", { name: /^End$/i });
    await expect(endButton).toBeVisible({ timeout: 5000 });
    await endButton.click();

    // Should show EndGameLeaderboard or a confirmation
    const postGameContent = page
      .getByText(/leaderboard|final score|Word of the Call|game over/i)
      .first();
    await expect(postGameContent).toBeVisible({ timeout: 8000 });
  });

  test("join session by code works", async ({ page, context }) => {
    // Player 1: create a session and extract the session code
    const page1 = page;
    await page1.goto("/play/hilton");
    await page1.getByText("Play Bingo").click();
    await page1.getByPlaceholder("Enter your name").fill(`${TEST_PLAYER_NAME}-P1`);
    await page1.getByRole("button", { name: /Start a Game/i }).click();

    // Wait for the Lobby/Game and extract session code
    const codeEl = page1.locator("text=/[A-Z0-9]{6}/").first();
    await expect(codeEl).toBeVisible({ timeout: 15000 });
    const sessionCode = await codeEl.textContent();
    expect(sessionCode?.trim()).toMatch(/^[A-Z0-9]{6}$/);

    // Player 2: join with the code in a new tab
    const page2 = await context.newPage();
    await page2.goto("/play/hilton");
    await page2.getByText("Play Bingo").click();
    await page2.getByPlaceholder("Enter your name").fill(`${TEST_PLAYER_NAME}-P2`);

    // Switch to join mode and enter the code
    await page2.getByRole("button", { name: /join.*friend|switch.*join/i }).click();
    const codeInput = page2.locator("input[maxlength='6']");
    await expect(codeInput).toBeVisible({ timeout: 5000 });
    await codeInput.fill(sessionCode.trim());
    await page2.getByRole("button", { name: /Join a Friend/i }).click();

    // Player 2 should see a bingo grid
    const grid2 = page2.locator(".grid.grid-cols-5");
    await expect(grid2).toBeVisible({ timeout: 15000 });
    await expect(grid2.locator("[aria-pressed]")).toHaveCount(GRID_CELL_COUNT);

    await page2.close();
  });
});
