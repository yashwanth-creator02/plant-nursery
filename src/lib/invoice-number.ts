import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoices, invoiceSequences } from "@/db/schema";
import {
  parseInvoiceNumber,
  formatInvoiceNumber,
  incrementInvoiceNumber,
} from "./invoice-format";

export { parseInvoiceNumber, formatInvoiceNumber, incrementInvoiceNumber };

// Get the current next invoice number from the active series,
// ensuring no collision with existing saved invoices.
export async function getNextInvoiceNumber(): Promise<string> {
  const rows = await db
    .select()
    .from(invoiceSequences)
    .where(eq(invoiceSequences.id, "default"))
    .limit(1);

  let candidate = rows.length > 0 ? rows[0].nextInvoiceNumber : null;

  if (!candidate) {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(sql`${invoices.invoiceNumber} like ${prefix + "%"}`);
    candidate = `${prefix}${String((count ?? 0) + 1).padStart(4, "0")}`;
  }

  // Verify candidate is not already used; advance if taken
  while (true) {
    const [existing] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.invoiceNumber, candidate))
      .limit(1);

    if (!existing) {
      break;
    }
    candidate = incrementInvoiceNumber(candidate);
  }

  return candidate;
}

// Advance the sequence after an invoice number has been used
export async function advanceInvoiceSequence(usedNumber: string): Promise<string> {
  let next = incrementInvoiceNumber(usedNumber);

  // Ensure next is not already taken in DB
  while (true) {
    const [existing] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.invoiceNumber, next))
      .limit(1);

    if (!existing) {
      break;
    }
    next = incrementInvoiceNumber(next);
  }

  await db
    .insert(invoiceSequences)
    .values({ id: "default", nextInvoiceNumber: next, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: invoiceSequences.id,
      set: { nextInvoiceNumber: next, updatedAt: new Date() },
    });

  return next;
}

// Set a custom starting invoice number (called from profile)
export async function setCustomInvoiceSequence(customNumber: string): Promise<string> {
  const trimmed = customNumber.trim();
  if (!trimmed) {
    throw new Error("Invoice number cannot be empty.");
  }

  await db
    .insert(invoiceSequences)
    .values({ id: "default", nextInvoiceNumber: trimmed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: invoiceSequences.id,
      set: { nextInvoiceNumber: trimmed, updatedAt: new Date() },
    });

  return trimmed;
}

export async function generateInvoiceNumber(): Promise<string> {
  return getNextInvoiceNumber();
}
