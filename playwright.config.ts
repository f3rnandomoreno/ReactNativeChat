import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:5000",
    trace: "on",
    video: "on",
    screenshot: "on",
    channel: "chrome",
    headless: false,
    launchOptions: {
      slowMo: 500,
    },
  },

  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
