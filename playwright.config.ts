import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: process.env.STAGING_URL || "http://localhost:3000",
    headless: true,
    storageState: "playwright/.auth/admin.json",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
