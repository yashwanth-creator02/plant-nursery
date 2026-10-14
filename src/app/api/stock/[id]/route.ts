import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stockItems } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  nameKn: z.string().trim().optional().nullable(),
  unit: z.string().trim().optional(),
  price: z.coerce.number().min(0).optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  category: z.string().trim().min(1).optional(),
  subcategory: z.string().trim().optional(),
  description: z.string().trim().optional().nullable(),
  descriptionKn: z.string().trim().optional().nullable(),
  gstRate: z.coerce.number().min(0).max(100).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) values.name = parsed.data.name;
    if (parsed.data.nameKn !== undefined) values.nameKn = parsed.data.nameKn;
    if (parsed.data.unit !== undefined) values.unit = parsed.data.unit.trim() || "pcs";
    if (parsed.data.price !== undefined)
      values.price = parsed.data.price.toFixed(2);
    if (parsed.data.quantity !== undefined)
      values.quantity = parsed.data.quantity;
    if (parsed.data.category !== undefined)
      values.category = parsed.data.category;
    if (parsed.data.subcategory !== undefined)
      values.subcategory = parsed.data.subcategory;
    if (parsed.data.description !== undefined)
      values.description = parsed.data.description;
    if (parsed.data.descriptionKn !== undefined)
      values.descriptionKn = parsed.data.descriptionKn;
    if (parsed.data.gstRate !== undefined)
      values.gstRate = parsed.data.gstRate.toFixed(2);
    if (parsed.data.category === "plants")
      values.gstRate = "0.00";

    const [item] = await db
      .update(stockItems)
      .set(values)
      .where(eq(stockItems.id, id))
      .returning();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    await db.delete(stockItems).where(eq(stockItems.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
