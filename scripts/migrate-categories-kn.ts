import "dotenv/config";
import postgres from "postgres";
import { translateCategory, translateSubcategory } from "../src/lib/plant-translations";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const sql = postgres(connectionString, { prepare: false });

  console.log("Migrating stock_categories and stock_subcategories to add name_kn...");

  // 1. Add name_kn column to stock_categories
  await sql`
    ALTER TABLE stock_categories
    ADD COLUMN IF NOT EXISTS name_kn TEXT;
  `;

  // 2. Add name_kn column to stock_subcategories
  await sql`
    ALTER TABLE stock_subcategories
    ADD COLUMN IF NOT EXISTS name_kn TEXT;
  `;

  // 3. Backfill categories
  const categories = await sql`SELECT id, name, slug, name_kn FROM stock_categories`;
  for (const cat of categories) {
    if (!cat.name_kn) {
      const kn = translateCategory(cat.name, "kn") || translateCategory(cat.slug, "kn") || cat.name;
      await sql`UPDATE stock_categories SET name_kn = ${kn} WHERE id = ${cat.id}`;
      console.log(`Updated category "${cat.name}" -> "${kn}"`);
    }
  }

  // 4. Backfill subcategories
  const subcategories = await sql`SELECT id, name, slug, category, name_kn FROM stock_subcategories`;
  for (const sub of subcategories) {
    if (!sub.name_kn) {
      const kn = translateSubcategory(sub.name, "kn") || translateSubcategory(sub.slug, "kn") || sub.name;
      await sql`UPDATE stock_subcategories SET name_kn = ${kn} WHERE id = ${sub.id}`;
      console.log(`Updated subcategory "${sub.name}" -> "${kn}"`);
    }
  }

  console.log("Migration complete!");
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
