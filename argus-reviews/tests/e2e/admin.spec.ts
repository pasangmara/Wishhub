import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { MOCK_WEBHOOK_PORT } from "../../playwright.config";
import { ADMIN, login, noHorizontalScroll, sql, startMockWebhook, uniq } from "./helpers";

test.describe("admin", () => {
  test("rejects a wrong password, then signs in and out", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.fill("#email", ADMIN.email);
    await page.fill("#password", "wrong-password");
    await page.click("button[type=submit]");
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();

    await login(page);
    await expect(page.getByText("Your review link")).toBeVisible();
    for (const label of ["Total Reviews", "Average Rating", "5-Star Reviews", "Pending Follow-ups", "Featured"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    expect(await noHorizontalScroll(page)).toBe(true);

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/reviews");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("review link: copy, QR, WhatsApp and email", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await login(page);
    await page.getByRole("button", { name: /Copy Link/ }).click();
    await expect(page.getByRole("button", { name: /Copied/ })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("http://localhost:3100/r/abc-restaurant");

    const wa = await page.getByRole("link", { name: "WhatsApp" }).getAttribute("href");
    expect(decodeURIComponent(wa!)).toContain("Thank you for visiting ABC Restaurant.");
    expect(decodeURIComponent(wa!)).toContain("/r/abc-restaurant?s=whatsapp");
    const mail = await page.getByRole("link", { name: "Email" }).getAttribute("href");
    expect(decodeURIComponent(mail!)).toContain("subject=How was your experience at ABC Restaurant?");
    await expect(page.getByRole("link", { name: "Open" })).toHaveAttribute("href", "http://localhost:3100/r/abc-restaurant");

    await page.getByRole("button", { name: "QR Code" }).click();
    await expect(page.getByRole("dialog", { name: "Review QR code" }).getByRole("img")).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "PNG" }).click();
    expect((await download).suggestedFilename()).toBe("abc-restaurant-review-qr.png");
  });

  test("manage reviews: drawer, approve, feature, consent guard", async ({ page, request }) => {
    const consented = uniq("approve me");
    const private_ = uniq("no consent");
    await request.post("/api/public/reviews", { data: { business_slug: "abc-restaurant", rating: 5, feedback: consented, name: "Drawer Guest", consent_to_publish: true } });
    await request.post("/api/public/reviews", { data: { business_slug: "abc-restaurant", rating: 4, feedback: private_, consent_to_publish: false } });

    await login(page);
    await page.goto(`/admin/reviews?q=${encodeURIComponent(consented)}`);
    await page.getByRole("button", { name: "Drawer Guest", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Review details" });
    await expect(drawer.getByText(consented)).toBeVisible();
    await expect(drawer.getByText("Consent given")).toBeVisible();
    await drawer.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Marked as approved")).toBeVisible();
    await drawer.getByRole("button", { name: "Feature" }).click();
    await expect(page.getByText("Marked as featured")).toBeVisible();
    await expect.poll(async () => (await sql`select status from reviews where feedback = ${consented}`)[0].status).toBe("FEATURED");

    await page.goto(`/admin/reviews?q=${encodeURIComponent(private_)}`);
    await page.getByRole("button", { name: "Anonymous guest", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Feature" })).toBeDisabled();
    // Opening a NEW review marks it as reviewed.
    await expect.poll(async () => (await sql`select status from reviews where feedback = ${private_}`)[0].status).toBe("REVIEWED");
  });

  test("customers: list and detail with history", async ({ page }) => {
    await login(page);
    await page.goto("/admin/customers?q=Rahim");
    await page.getByRole("button", { name: "Rahim Ahmed" }).click();
    const drawer = page.getByRole("dialog", { name: "Customer" });
    await expect(drawer.getByText("Review history (2)")).toBeVisible();
    await expect(drawer.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", "https://wa.me/8801711000001");
    await drawer.getByRole("button", { name: "Completed" }).click();
    await expect.poll(async () => (await sql`select status from customers where phone = '+8801711000001'`)[0].status).toBe("COMPLETED");
  });

  test("branding and settings changes reach the public page", async ({ page }) => {
    await login(page);
    await page.goto("/admin/branding");
    const headline = `E2E headline ${Date.now()}`;
    await page.getByLabel("Headline").fill(headline);
    // Live preview updates while typing.
    await expect(page.getByRole("heading", { name: headline })).toBeVisible();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved")).toBeVisible();
    await page.goto("/r/abc-restaurant");
    await expect(page.getByRole("heading", { name: headline })).toBeVisible();

    await page.goto("/admin/settings");
    await page.getByLabel("Opening hours").fill("Daily 11–11");
    await page.getByRole("button", { name: "Save changes" }).first().click();
    await expect(page.getByText("Saved").first()).toBeVisible();
    await page.goto("/admin/settings/share");
    await expect(page.getByText("Share Your Experience").first()).toBeVisible();
    await sql`update businesses set headline = 'How was your dining experience?' where slug = 'abc-restaurant'`;
  });

  test("creatives: create a post from a featured review", async ({ page }) => {
    await login(page);
    await page.goto("/admin/creatives");
    await page.getByRole("button", { name: "Create post" }).first().click();
    const approve = page.getByRole("button", { name: "Approve" }).first();
    await expect(approve).toBeVisible();
    const img = page.locator('img[alt^="Quote card"]').first();
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), { timeout: 15_000 }).toBe(1080);
  });

  test("n8n: webhook test event, signed review.created, API key access", async ({ page, request }) => {
    test.skip(test.info().project.name !== "desktop", "Uses a fixed mock port");
    const mock = await startMockWebhook(MOCK_WEBHOOK_PORT);
    try {
      await login(page);
      await page.goto("/admin/integrations");
      await page.getByLabel("Webhook URL").fill(`http://localhost:${MOCK_WEBHOOK_PORT}/hook`);
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page.getByText("Saved")).toBeVisible();
      await page.getByRole("button", { name: /Send test event/ }).click();
      await expect(page.getByText(/Delivered \(HTTP 200\)/)).toBeVisible();
      expect(mock.received.at(-1)!.headers["x-argus-event"]).toBe("test");

      const feedback = uniq("webhook");
      await request.post("/api/public/reviews", { data: { business_slug: "abc-restaurant", rating: 5, feedback, name: "Hook Guest" } });
      await expect.poll(() => mock.received.some((r) => r.body.includes(feedback)), { timeout: 10_000 }).toBe(true);
      const hit = mock.received.find((r) => r.body.includes(feedback))!;
      const [{ webhook_secret }] = await sql`select webhook_secret from integrations limit 1`;
      const expected = createHmac("sha256", webhook_secret).update(`${hit.headers["x-argus-timestamp"]}.${hit.body}`).digest("hex");
      expect(hit.headers["x-argus-signature"]).toBe(`sha256=${expected}`);
      const payload = JSON.parse(hit.body);
      expect(payload.event).toBe("review.created");
      expect(payload.data).toMatchObject({ business: "ABC Restaurant", customer_name: "Hook Guest", rating: 5, feedback, status: "NEW" });

      await page.getByRole("button", { name: /Generate API key|Regenerate key/ }).click();
      const key = (await page.getByLabel("API key", { exact: true }).textContent())!.trim();
      expect(key).toMatch(/^argus_sk_/);
      const list = await request.get("/api/integrations/v1/reviews?limit=5", { headers: { authorization: `Bearer ${key}` } });
      expect(list.ok()).toBe(true);
      const body = await list.json();
      expect(body.reviews[0]).toHaveProperty("review_id");
      const patched = await request.patch(`/api/integrations/v1/reviews/${payload.data.review_id}`, { headers: { authorization: `Bearer ${key}` }, data: { status: "APPROVED" } });
      expect((await patched.json()).review.status).toBe("APPROVED");
      const creative = await request.post("/api/integrations/v1/creatives", { headers: { authorization: `Bearer ${key}` }, data: { review_id: payload.data.review_id, caption: "From n8n" } });
      expect(creative.status()).toBe(409); // guest did not consent
    } finally {
      await mock.close();
    }
  });
});
