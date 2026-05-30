// Public smoke tests — verify all public routes load correctly.
// Runs against the live site (BASE_URL env var, defaults to https://thereitis.live).
// Does not create any DB rows. Safe to run in CI.

import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/There It Is/i);
  });

  test("contains meta description", async ({ page }) => {
    await page.goto("/");
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute("content", /.+/);
  });

  test("shows Pick a Company entry point", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Pick a Company/i).first()).toBeVisible();
  });

  test("mobile viewport renders without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 2); // 2px tolerance for scrollbar
  });
});

test.describe("Company selector", () => {
  test("loads at /companies", async ({ page }) => {
    await page.goto("/companies");
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows at least one active company", async ({ page }) => {
    await page.goto("/companies");
    // Active companies render as clickable cards with a "Start a Game" button
    const companyButton = page.getByText(/Start a Game|Join the Live Call/i).first();
    await expect(companyButton).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Play route", () => {
  test("loads /play/hilton without error", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/play/hilton");
    await page.waitForTimeout(2000);
    // Should not crash — either shows ModeSelect or redirects
    expect(errors.filter((e) => !e.includes("ResizeObserver"))).toHaveLength(0);
    await expect(page.locator("body")).toBeVisible();
  });

  test("ModeSelect shows Play Bingo option for valid company", async ({ page }) => {
    await page.goto("/play/hilton");
    await expect(page.getByText("Play Bingo")).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Admin route", () => {
  test("/gate requires authentication", async ({ page }) => {
    await page.goto("/gate");
    // Should show a login form or redirect — not show admin content unauthenticated
    await page.waitForTimeout(2000);
    const adminContent = page.getByText(/company readiness|phrase staging|session stats/i);
    await expect(adminContent).not.toBeVisible();
    // Should show a sign-in form
    const signIn = page.getByText(/sign in|log in|password|email/i).first();
    await expect(signIn).toBeVisible();
  });
});

test.describe("Mobile layout — bingo card integrity", () => {
  test("game card does not overflow on 375px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/play/hilton");
    // Navigate to name entry to get closer to the card
    await page.getByText("Play Bingo").click();
    await page.waitForTimeout(500);
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 2);
  });
});
