import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["json", { outputFile: "reports/playwright-results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "https://thereitis.live",
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: "**/smoke/**",
    },
  ],
});
