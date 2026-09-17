import { NextRequest, NextResponse } from "next/server";
import { asc, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stockItems, stockItemImages } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

const createSchema = z.object({
  name: z.string().trim().optional().default("Plant / Item"),
  nameKn: z.string().trim().optional().nullable(),
  unit: z.string().trim().default("pcs"),
  price: z.coerce.number().min(0).optional().default(0),
  quantity: z.coerce.number().int().min(0).optional().default(0),
  category: z.string().trim().min(1).optional().default("plants"),
  subcategory: z.string().trim().optional().default("other"),
  description: z.string().trim().optional().nullable(),
  descriptionKn: z.string().trim().optional().nullable(),
});

export async function GET() {
  try {
    await requireUser();
    const items = await db.query.stockItems.findMany({
      orderBy: [asc(stockItems.name)],
      with: {
        images: {
          orderBy: [desc(stockItemImages.isPrimary), desc(stockItemImages.createdAt)],
        },
      },
    });
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
    const { name, nameKn, unit, price, quantity, category, subcategory, description, descriptionKn } = parsed.data;
    const [item] = await db
      .insert(stockItems)
      .values({
        name,
        nameKn: nameKn || null,
        unit: unit || "pcs",
        price: price.toFixed(2),
        quantity,
        category,
        subcategory,
        description: description || null,
        descriptionKn: descriptionKn || null,
      })
      .returning();
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
