import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { noHorizontalScroll, sql, uniq } from "./helpers";

const URL = "/r/abc-restaurant";

async function fillAndSubmit(page: import("@playwright/test").Page, opts: { rating: number; feedback: string }) {
  await page.getByRole("radio", { name: new RegExp(`^${opts.rating} stars? –`) }).click();
  await page.getByLabel("Tell us about your experience").fill(opts.feedback);
  await page.getByRole("button", { name: /Submit Feedback/ }).click();
}

test.describe("public review page", () => {
  test("renders branding with no login and no horizontal scroll on phones", async ({ page }) => {
    for (const width of [375, 390, 412]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(URL);
      await expect(page.getByRole("heading", { name: "How was your dining experience?" })).toBeVisible();
      await expect(page.getByText("ABC Restaurant", { exact: true })).toBeVisible();
      expect(await noHorizontalScroll(page), `no horizontal scroll at ${width}px`).toBe(true);
      // Nothing account-related, ever.
      await expect(page.getByText(/sign in|log in|sign up|password/i)).toHaveCount(0);
      // Star buttons are comfortable touch targets.
      const box = await page.getByRole("radio", { name: /^1 star/ }).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("shows a friendly message for an invalid link", async ({ page }) => {
    const res = await page.goto("/r/this-business-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Sorry, this review link is unavailable." })).toBeVisible();
  });

  test("requires a rating and feedback", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /Submit Feedback/ }).click();
    await expect(page.getByText("Please choose a star rating.")).toBeVisible();
    await expect(page.getByText("Please tell us a little about your experience.")).toBeVisible();
  });

  for (const rating of [5, 4, 3, 2, 1]) {
    test(`${rating}-star flow ${rating >= 4 ? "offers" : "does not offer"} Google review`, async ({ page }) => {
      const feedback = uniq(`${rating} star`);
      await page.goto(`${URL}?s=whatsapp`);
      await fillAndSubmit(page, { rating, feedback });
      if (rating >= 4) {
        await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
        await expect(page.getByText("We're glad you had a great experience.")).toBeVisible();
        await expect(page.getByText("Would you like to share your experience on Google?")).toBeVisible();
        await expect(page.getByRole("link", { name: /Review us on Google/ })).toHaveAttribute("href", /google\.com/);
      } else {
        await expect(page.getByRole("heading", { name: "Thank you for your feedback." })).toBeVisible();
        await expect(page.getByText("Your feedback helps us improve.")).toBeVisible();
        await expect(page.getByRole("link", { name: /Google/ })).toHaveCount(0);
      }
      const [row] = await sql`select rating, status, source, customer_id, consent_to_publish from reviews where feedback = ${feedback}`;
      expect(row).toMatchObject({ rating, source: "whatsapp", customer_id: null, consent_to_publish: false });
      expect(row.status).toBe(rating >= 4 ? "NEW" : "FOLLOW_UP");
    });
  }

  test("saves optional name, contact, consent and photo", async ({ page }, info) => {
    const feedback = uniq("full");
    const img = info.outputPath("photo.png");
    await sharp({ create: { width: 2400, height: 1600, channels: 3, background: "#c2410c" } }).png().toFile(img);

    await page.goto(`${URL}?s=qr`);
    await page.getByRole("radio", { name: /^5 stars/ }).click();
    await page.getByRole("radiogroup", { name: "How was your food?" }).getByRole("radio", { name: "4 stars" }).click();
    await page.getByLabel("Tell us about your experience").fill(feedback);
    await page.getByRole("button", { name: "Service", exact: true }).click();
    await page.getByLabel(/Your name/).fill("Nadia Rahman");
    await page.getByLabel(/Phone or email/).fill("nadia.e2e@example.com");
    await page.locator('input[type="file"]').setInputFiles(img);
    await expect(page.getByText("Photo added")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Submit Feedback/ }).click();
    await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();

    const [row] = await sql`
      select r.*, c.name, c.email, m.width, m.mime from reviews r
      join customers c on c.id = r.customer_id
      join review_media m on m.review_id = r.id
      where r.feedback = ${feedback}`;
    expect(row).toMatchObject({ source: "qr", consent_to_publish: true, service_type: "Service", name: "Nadia Rahman", email: "nadia.e2e@example.com", mime: "image/webp" });
    expect(row.answers).toEqual({ food: 4 });
    expect(row.width).toBeLessThanOrEqual(1600);
    expect(row.photo_url).toMatch(/^reviews\//);
  });

  test("double-clicking submit creates exactly one review", async ({ page }) => {
    const feedback = uniq("double");
    await page.goto(URL);
    await page.getByRole("radio", { name: /^5 stars/ }).click();
    await page.getByLabel("Tell us about your experience").fill(feedback);
    const submit = page.getByRole("button", { name: /Submit Feedback/ });
    await submit.dblclick();
    await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
    const rows = await sql`select id from reviews where feedback = ${feedback}`;
    expect(rows).toHaveLength(1);
  });

  test("renders quickly on a slow 3G connection", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium");
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8 });
    const start = Date.now();
    await page.goto(URL, { waitUntil: "commit" });
    await expect(page.getByRole("heading", { name: "How was your dining experience?" })).toBeVisible();
    const headlineMs = Date.now() - start;
    await expect(page.getByRole("button", { name: /Submit Feedback/ })).toBeVisible();
    // Server-rendered: branding + form are in the first HTML response, no loading spinner.
    expect(headlineMs).toBeLessThan(8000);
    await expect(page.getByText(/^Loading/)).toHaveCount(0);
  });
});

test.describe("public API security", () => {
  test("public config exposes only public fields", async ({ request }) => {
    const res = await request.get("/api/public/business/abc-restaurant");
    expect(res.ok()).toBe(true);
    const { business } = await res.json();
    expect(business.name).toBe("ABC Restaurant");
    for (const key of ["id", "google_review_url", "settings", "plan", "status", "reviews", "customers"]) {
      expect(business).not.toHaveProperty(key);
    }
    expect((await request.get("/api/public/business/nope")).status()).toBe(404);
  });

  test("reviews endpoint only creates — it never lists", async ({ request }) => {
    expect((await request.get("/api/public/reviews")).status()).toBe(405);
    const bad = await request.post("/api/public/reviews", { data: { business_slug: "abc-restaurant", rating: 9, feedback: "x" } });
    expect(bad.status()).toBe(422);
    const empty = await request.post("/api/public/reviews", { data: { business_slug: "abc-restaurant", rating: 5, feedback: "" } });
    expect(empty.status()).toBe(422);
    const ok = await request.post("/api/public/reviews", { data: { business_slug: "abc-restaurant", rating: 5, feedback: uniq("api"), source: "email" } });
    const body = await ok.json();
    expect(Object.keys(body).sort()).toEqual(["google_review_url", "rating", "review_id", "show_google_review", "success"]);
  });

  test("admin and integration APIs require authentication", async ({ request }) => {
    for (const path of ["/api/admin/qr", "/api/admin/export", "/api/admin/media/00000000-0000-0000-0000-000000000000"]) {
      expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(401);
    }
    expect((await request.get("/api/integrations/v1/reviews")).status()).toBe(401);
    expect((await request.get("/api/integrations/v1/reviews", { headers: { authorization: "Bearer argus_sk_wrong" } })).status()).toBe(401);
    const page = await request.get("/admin/reviews", { maxRedirects: 0 });
    expect(page.status()).toBe(307);
    expect(page.headers()["location"]).toContain("/admin/login");
  });
});
