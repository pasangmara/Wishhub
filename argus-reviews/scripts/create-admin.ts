/**
 * Create (or reset the password of) an admin and attach them to a business.
 *
 *   ADMIN_EMAIL=me@hotel.com ADMIN_PASSWORD='…' npm run admin:create -- --business abc-restaurant
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = (arg("email") ?? process.env.ADMIN_EMAIL)?.trim().toLowerCase();
  const password = arg("password") ?? process.env.ADMIN_PASSWORD;
  const slug = arg("business") ?? "abc-restaurant";
  const role = (arg("role") ?? "OWNER").toUpperCase() as "OWNER" | "STAFF";
  if (!email || !password) throw new Error("Provide ADMIN_EMAIL and ADMIN_PASSWORD (env or --email/--password)");
  if (password.length < 10) throw new Error("Password must be at least 10 characters");

  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });
  const [business] = await db.select().from(schema.businesses).where(eq(schema.businesses.slug, slug)).limit(1);
  if (!business) throw new Error(`Business "${slug}" not found`);

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(schema.adminUsers)
    .values({ email, name: process.env.ADMIN_NAME || null, passwordHash })
    .onConflictDoUpdate({ target: schema.adminUsers.email, set: { passwordHash } })
    .returning();
  await db
    .insert(schema.businessMembers)
    .values({ userId: user.id, businessId: business.id, role })
    .onConflictDoNothing();
  console.log(`✓ ${email} can now sign in at /admin/login and manage ${business.name}`);
  await client.end();
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
