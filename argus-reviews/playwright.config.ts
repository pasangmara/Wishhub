import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const E2E_DB = process.env.E2E_DATABASE_URL ?? "postgres://argus:argus@localhost:5432/argus_e2e";
export const MOCK_WEBHOOK_PORT = 3199;

const env = {
  DATABASE_URL: E2E_DB,
  AUTH_SECRET: "e2e-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
  NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
  ADMIN_EMAIL: "owner@e2e.test",
  ADMIN_PASSWORD: "e2e-password-123",
  ADMIN_NAME: "E2E Owner",
  STORAGE_DRIVER: "local",
  UPLOAD_DIR: "./test-results/uploads",
  // Every e2e request comes from localhost; the limiter itself is covered by unit tests.
  REVIEW_RATE_LIMIT_PER_HOUR: "100000",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 860 } } },
  ],
  webServer: {
    command: `npm run db:migrate && npm run db:seed -- --reset && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/r/abc-restaurant`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: { ...env, NODE_ENV: "production" },
    stdout: "ignore",
    stderr: "pipe",
  },
});
