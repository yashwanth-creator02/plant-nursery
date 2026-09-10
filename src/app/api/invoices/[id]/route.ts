import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { invoiceItems, invoices, stockItems } from "@/db/schema";
import { requireUser, ForbiddenError } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

const lineItemSchema = z.object({
  stockItemId: z.string().uuid().nullable().optional(),
  name: z.string().trim().optional().default("Item"),
  price: z.coerce.number().min(0).optional().default(0),
  quantity: z.coerce.number().int().min(0).optional().default(1),
});

const updateSchema = z.object({
  customerName: z.string().trim().optional(),
  customerDetails: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z.array(lineItemSchema).optional(),
  action: z.enum(["save", "finalize"]).default("save"),
});

class StockShortageError extends Error {
  itemName: string;
  available: number;
  constructor(itemName: string, available: number) {
    super("Stock shortage");
    this.itemName = itemName;
    this.available = available;
  }
}

async function loadInvoiceForUser(id: string, userId: string, isAdmin: boolean) {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: { items: true, createdByUser: { columns: { username: true } } },
  });
  if (!invoice) return null;
  if (!isAdmin && invoice.createdBy !== userId) {
    throw new ForbiddenError();
  }
  return invoice;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const invoice = await loadInvoiceForUser(id, user.id, user.role === "admin");
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json({ invoice });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const isAdmin = user.role === "admin";

    const existing = await loadInvoiceForUser(id, user.id, isAdmin);
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (existing.status === "final") {
      return NextResponse.json(
        { error: "This invoice is already finalized and can't be edited." },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }
    const { customerName, customerDetails, notes, items, action } = parsed.data;

    const result = await db.transaction(async (tx) => {
      if (items) {
        const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        if (action === "finalize") {
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
          for (const li of items) {
            if (!li.stockItemId) continue;
            await tx
              .update(stockItems)
              .set({
                quantity: sql`${stockItems.quantity} - ${li.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(stockItems.id, li.stockItemId));
          }
        }

        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        if (items.length > 0) {
          await tx.insert(invoiceItems).values(
            items.map((li) => ({
              invoiceId: id,
              stockItemId: li.stockItemId || null,
              name: li.name || "Item",
              price: (li.price ?? 0).toFixed(2),
              quantity: li.quantity ?? 1,
              lineTotal: ((li.price ?? 0) * (li.quantity ?? 1)).toFixed(2),
            }))
          );
        }

        await tx
          .update(invoices)
          .set({
            customerName: customerName ?? existing.customerName,
            customerDetails: customerDetails ?? existing.customerDetails,
            notes: notes ?? existing.notes,
            total: total.toFixed(2),
            status: action === "finalize" ? "final" : "draft",
            finalizedAt: action === "finalize" ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, id));
      } else {
        await tx
          .update(invoices)
          .set({
            customerName: customerName ?? existing.customerName,
            customerDetails: customerDetails ?? existing.customerDetails,
            notes: notes ?? existing.notes,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, id));
      }

      return db.query.invoices.findFirst({
        where: eq(invoices.id, id),
        with: { items: true, createdByUser: { columns: { username: true } } },
      });
    });

    return NextResponse.json({ invoice: result });
  } catch (err) {
    if (err instanceof StockShortageError) {
      return NextResponse.json(
        {
          error: `Not enough stock for "${err.itemName}" (${err.available} available).`,
        },
        { status: 409 }
      );
    }
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await loadInvoiceForUser(id, user.id, user.role === "admin");
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (existing.status === "final") {
      return NextResponse.json(
        { error: "Finalized invoices can't be deleted." },
        { status: 409 }
      );
    }
    await db.delete(invoices).where(eq(invoices.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
