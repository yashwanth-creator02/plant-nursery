import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { invoiceItems, invoices, stockItems, businessSettings } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { generateInvoiceNumber, advanceInvoiceSequence } from "@/lib/invoice-number";

const lineItemSchema = z.object({
  stockItemId: z.string().uuid().nullable().optional(),
  name: z.string().trim().optional().default("Item"),
  price: z.coerce.number().min(0).optional().default(0),
  quantity: z.coerce.number().int().min(0).optional().default(1),
});

const createSchema = z.object({
  invoiceNumber: z.string().trim().optional(),
  customerName: z.string().trim().optional().default(""),
  customerDetails: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
  status: z.enum(["draft", "final"]).default("draft"),
  force: z.boolean().optional().default(false),
  items: z.array(lineItemSchema).optional().default([]),
});

export async function GET() {
  try {
    const user = await requireUser();

    const rows = await db.query.invoices.findMany({
      where: user.role === "admin" ? undefined : eq(invoices.createdBy, user.id),
      orderBy: [desc(invoices.createdAt)],
      with: {
        createdByUser: { columns: { username: true } },
      },
    });

    return NextResponse.json({ invoices: rows });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }
    const { invoiceNumber: customNumber, customerName, customerDetails, notes, status, force, items } = parsed.data;

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const result = await db.transaction(async (tx) => {
      // If finalizing immediately, verify + deduct stock inside the
      // transaction so a stock shortfall rolls back the whole invoice unless forced.
      if (status === "final") {
        if (!force) {
          for (const li of items) {
            if (!li.stockItemId) continue;
            const [stockItem] = await tx
              .select()
              .from(stockItems)
              .where(eq(stockItems.id, li.stockItemId))
              .limit(1);
            if (!stockItem) continue;
            if (stockItem.quantity < li.quantity) {
              throw new StockShortageError(stockItem.name, stockItem.quantity);
            }
          }
        }
        for (const li of items) {
          if (!li.stockItemId) continue;
          await tx
            .update(stockItems)
            .set({
              quantity: sqlDecrement(li.quantity),
              updatedAt: new Date(),
            })
            .where(eq(stockItems.id, li.stockItemId));
        }
      }

      let invoiceNumber = customNumber?.trim();
      if (invoiceNumber) {
        const [conflict] = await tx
          .select({ id: invoices.id })
          .from(invoices)
          .where(eq(invoices.invoiceNumber, invoiceNumber))
          .limit(1);

        if (conflict) {
          throw new InvoiceNumberConflictError(invoiceNumber);
        }
      } else {
        invoiceNumber = await generateInvoiceNumber();
      }

      // Advance sequence so future invoices continue from this series
      await advanceInvoiceSequence(invoiceNumber);

      const activeSettings = await tx
        .select()
        .from(businessSettings)
        .orderBy(desc(businessSettings.version))
        .limit(1);

      const version = activeSettings.length > 0 ? activeSettings[0].version : 1;
      const headerSnapshot = activeSettings.length > 0
        ? JSON.stringify({
            businessName: activeSettings[0].businessName,
            subheading1: activeSettings[0].subheading1,
            subheading2: activeSettings[0].subheading2,
            address: activeSettings[0].address,
            mobiles: activeSettings[0].mobiles,
            gstin: activeSettings[0].gstin,
          })
        : JSON.stringify({
            businessName: "SRI VIJAYA LAKSHMI NURSERY",
            subheading1: "(Approved by Department of Horticulture)",
            subheading2: "(All Kinds of Plants Production and Suppliers)",
            address: "Harige B. H. Road, Shimoga - 577203",
            mobiles: "7353025302, 9448140483, 9606602194",
            gstin: "29ADXPV1295N2Z6",
          });

      const [invoice] = await tx
        .insert(invoices)
        .values({
          invoiceNumber,
          customerName,
          customerDetails,
          notes,
          status,
          version,
          headerSnapshot,
          total: total.toFixed(2),
          createdBy: user.id,
          finalizedAt: status === "final" ? new Date() : null,
        })
        .returning();

      if (items.length > 0) {
        await tx.insert(invoiceItems).values(
          items.map((li) => ({
            invoiceId: invoice.id,
            stockItemId: li.stockItemId || null,
            name: li.name || "Item",
            price: (li.price ?? 0).toFixed(2),
            quantity: li.quantity ?? 1,
            lineTotal: ((li.price ?? 0) * (li.quantity ?? 1)).toFixed(2),
          }))
        );
      }

      return invoice;
    });

    return NextResponse.json({ invoice: result }, { status: 201 });
  } catch (err) {
    if (err instanceof StockShortageError) {
      return NextResponse.json(
        {
          error: `Not enough stock for "${err.itemName}" (${err.available} available).`,
        },
        { status: 409 }
      );
    }
    if (err instanceof InvoiceNumberConflictError) {
      return NextResponse.json(
        {
          error: `Invoice number "${err.number}" already exists. Please pick a different number.`,
        },
        { status: 409 }
      );
    }
    return handleApiError(err);
  }
}

class InvoiceNumberConflictError extends Error {
  number: string;
  constructor(number: string) {
    super("Invoice number conflict");
    this.number = number;
  }
}

class StockShortageError extends Error {
  itemName: string;
  available: number;
  constructor(itemName: string, available: number) {
    super("Stock shortage");
    this.itemName = itemName;
    this.available = available;
  }
}

// Small helper for an atomic `quantity = quantity - n` update.
import { sql } from "drizzle-orm";
function sqlDecrement(n: number) {
  return sql`${stockItems.quantity} - ${n}`;
}
