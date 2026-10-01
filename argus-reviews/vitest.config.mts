import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/support/global-setup.ts"],
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://argus:argus@localhost:5432/argus_test",
      AUTH_SECRET: "test-secret-for-vitest-0123456789-abcdefghijklmnop",
      NEXT_PUBLIC_APP_URL: "https://review.example.test",
    },
    fileParallelism: false,
  },
});
