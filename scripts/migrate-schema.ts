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

  console.log("Database migrations applied successfully.");
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
