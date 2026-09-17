import "dotenv/config";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const sql = postgres(connectionString, { prepare: false });

  console.log("Applying database migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS business_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      version INTEGER NOT NULL DEFAULT 1,
      business_name TEXT NOT NULL DEFAULT 'SRI VIJAYA LAKSHMI NURSERY',
      subheading_1 TEXT NOT NULL DEFAULT '(Approved by Department of Horticulture)',
      subheading_2 TEXT NOT NULL DEFAULT '(All Kinds of Plants Production and Suppliers)',
      address TEXT NOT NULL DEFAULT 'Harige B. H. Road, Shimoga - 577203',
      mobiles TEXT NOT NULL DEFAULT '7353025302, 9448140483, 9606602194',
      gstin TEXT NOT NULL DEFAULT '29ADXPV1295N2Z6',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    ALTER TABLE invoices 
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
  `;

  await sql`
    ALTER TABLE invoices 
    ADD COLUMN IF NOT EXISTS header_snapshot TEXT;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS invoice_sequences (
      id TEXT PRIMARY KEY DEFAULT 'default',
      next_invoice_number TEXT NOT NULL DEFAULT 'INV-2026-0001',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    INSERT INTO invoice_sequences (id, next_invoice_number)
    VALUES ('default', 'INV-2026-0001')
    ON CONFLICT (id) DO NOTHING;
  `;

  await sql`
    ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'cash';
  `;

  await sql`
    ALTER TABLE business_settings
    ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
  `;

  await sql`
    ALTER TABLE business_settings
    ADD COLUMN IF NOT EXISTS logo_data TEXT;
  `;

  await sql`
    ALTER TABLE stock_items
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'plants';
  `;

  await sql`
    ALTER TABLE stock_items
    ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT 'other';
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS stock_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    INSERT INTO stock_categories (name, slug)
    VALUES ('Plants', 'plants'), ('Non-Plants', 'non-plants')
    ON CONFLICT (slug) DO NOTHING;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS stock_subcategories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS stock_subcategories_cat_slug_idx 
    ON stock_subcategories (category, slug);
  `;

  const defaultPlantSubs = [
    { category: "plants", name: "Fruit Plants", slug: "fruit" },
    { category: "plants", name: "Flower Plants", slug: "flower" },
    { category: "plants", name: "Ornamental Plants", slug: "ornamental" },
    { category: "plants", name: "Medicinal Plants", slug: "medicinal" },
    { category: "plants", name: "Other Plants", slug: "other" },
  ];

  const defaultNonPlantSubs = [
    { category: "non-plants", name: "Pots & Planters", slug: "pots" },
    { category: "non-plants", name: "Fertilizers & Manure", slug: "fertilizers" },
    { category: "non-plants", name: "Soil & Substrates", slug: "soil" },
    { category: "non-plants", name: "Gardening Tools", slug: "tools" },
    { category: "non-plants", name: "General Supplies", slug: "general" },
  ];

  for (const sub of [...defaultPlantSubs, ...defaultNonPlantSubs]) {
    await sql`
      INSERT INTO stock_subcategories (category, name, slug)
      VALUES (${sub.category}, ${sub.name}, ${sub.slug})
      ON CONFLICT (category, slug) DO NOTHING;
    `;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS stock_item_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      description TEXT,
      is_primary BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS stock_item_images_stock_item_id_idx
    ON stock_item_images (stock_item_id);
  `;

  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS signature TEXT;
  `;

  await sql`
    ALTER TABLE stock_items
    ADD COLUMN IF NOT EXISTS description TEXT;
  `;

  await sql`
    ALTER TABLE stock_items
    ADD COLUMN IF NOT EXISTS name_kn TEXT;
  `;

  await sql`
    ALTER TABLE stock_items
    ADD COLUMN IF NOT EXISTS description_kn TEXT;
  `;

  await sql`
    ALTER TABLE stock_item_images
    ADD COLUMN IF NOT EXISTS description_kn TEXT;
  `;

  // Backfill existing stock_items with Kannada names if null
  try {
    const { translateItemName } = await import("../src/lib/plant-translations");
    const allItems = await sql`SELECT id, name, name_kn FROM stock_items WHERE name_kn IS NULL OR name_kn = ''`;
    for (const item of allItems) {
      const kn = translateItemName(item.name, "kn");
      if (kn && kn !== item.name) {
        await sql`UPDATE stock_items SET name_kn = ${kn} WHERE id = ${item.id}`;
      }
    }
    console.log(`Backfilled Kannada names for ${allItems.length} stock items.`);
  } catch (err) {
    console.warn("Backfill note:", err);
  }

  console.log("Database migrations applied successfully.");
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
