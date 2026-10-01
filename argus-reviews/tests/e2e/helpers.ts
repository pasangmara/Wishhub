import { createServer, type Server } from "node:http";
import type { Page } from "@playwright/test";
import postgres from "postgres";
import { E2E_DB } from "../../playwright.config";

export const sql = postgres(E2E_DB, { max: 2, onnotice: () => {} });

export const ADMIN = { email: "owner@e2e.test", password: "e2e-password-123" };

export async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", ADMIN.email);
  await page.fill("#password", ADMIN.password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/admin");
}

export async function noHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

export type Captured = { headers: Record<string, string | string[] | undefined>; body: string };

/** Tiny local stand-in for an n8n webhook. */
export function startMockWebhook(port: number) {
  const received: Captured[] = [];
  const server: Server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      received.push({ headers: req.headers, body });
      res.writeHead(200, { "content-type": "application/json" });
      res.end('{"ok":true}');
    });
  });
  return new Promise<{ received: Captured[]; close: () => Promise<void> }>((resolve) =>
    server.listen(port, () => resolve({ received, close: () => new Promise((r) => server.close(() => r())) })),
  );
}

export function uniq(label: string) {
  return `E2E ${label} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
