import { defineConfig, devices } from "@playwright/test";

// A separate port so tests never collide with a run the user is checking.
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  // The API is mocked in every test, so no OpenAI key is needed.
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
