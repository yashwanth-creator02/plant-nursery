import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stockItems } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  unit: z.string().trim().default("pcs"),
  price: z.number().nonnegative(),
  quantity: z.number().int().nonnegative(),
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
    const { name, unit, price, quantity } = parsed.data;
    const [item] = await db
      .insert(stockItems)
      .values({
        name,
        unit: unit || "pcs",
        price: price.toFixed(2),
        quantity,
      })
      .returning();
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
