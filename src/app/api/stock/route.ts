import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stockItems } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

const createSchema = z.object({
  name: z.string().trim().optional().default("Plant / Item"),
  unit: z.string().trim().default("pcs"),
  price: z.coerce.number().min(0).optional().default(0),
  quantity: z.coerce.number().int().min(0).optional().default(0),
  category: z.enum(["plants", "non-plants"]).optional().default("plants"),
  subcategory: z.string().trim().optional().default("other"),
});

export async function GET() {
  try {
    await requireUser();
    const items = await db
      .select()
      .from(stockItems)
      .orderBy(asc(stockItems.name));
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }
    const { name, unit, price, quantity, category, subcategory } = parsed.data;
    const [item] = await db
      .insert(stockItems)
      .values({
        name,
        unit: unit || "pcs",
        price: price.toFixed(2),
        quantity,
        category,
        subcategory,
      })
      .returning();
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
