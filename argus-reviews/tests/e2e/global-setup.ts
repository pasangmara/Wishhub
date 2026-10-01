import postgres from "postgres";
import { E2E_DB } from "../../playwright.config";

/** Removes reviews created by previous e2e runs so assertions start clean. */
export default async function globalSetup() {
  const sql = postgres(E2E_DB, { max: 1, onnotice: () => {} });
  try {
    await sql`delete from reviews where feedback like 'E2E%'`;
    await sql`delete from integrations`;
    await sql`update businesses set headline = 'How was your dining experience?' where slug = 'abc-restaurant'`;
  } catch {
    // First run: tables are created by the webServer command.
  } finally {
    await sql.end();
  }
}
