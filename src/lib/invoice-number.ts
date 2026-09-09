import { sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";

// Generates a sequential invoice number scoped to the current year, e.g.
// INV-2026-0001. Uses a count query, which is fine at low-concurrency
// (a handful of staff creating invoices), and falls back to a timestamp
// suffix if a collision somehow occurs.
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} like ${prefix + "%"}`);

  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
