import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stockItems, stockSubcategories } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

function slugify(text: string): string {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || `sub-${Date.now()}`;
}

const createSubcategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  category: z.enum(["plants", "non-plants"]),
});

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get("category");

    let query = db.select().from(stockSubcategories).$dynamic();
    if (categoryParam === "plants" || categoryParam === "non-plants") {
      query = query.where(eq(stockSubcategories.category, categoryParam));
    }

    const subcategories = await query.orderBy(asc(stockSubcategories.createdAt));
    return NextResponse.json({ subcategories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = createSubcategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const { name, category } = parsed.data;
    const slug = slugify(name);

    // Check if duplicate slug or name exists for this category
    const existing = await db
      .select()
      .from(stockSubcategories)
      .where(
        and(
          eq(stockSubcategories.category, category),
          ilike(stockSubcategories.name, name)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `"${name}" subcategory already exists` },
        { status: 400 }
      );
    }

    const [subcategory] = await db
      .insert(stockSubcategories)
      .values({
        category,
        name,
        slug,
      })
      .returning();

    return NextResponse.json({ subcategory }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Subcategory ID required" }, { status: 400 });
    }

    const [sub] = await db
      .select()
      .from(stockSubcategories)
      .where(eq(stockSubcategories.id, id));

    if (!sub) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    // Check if any items use this subcategory
    const itemsUsingSub = await db
      .select({ id: stockItems.id })
      .from(stockItems)
      .where(
        and(
          eq(stockItems.category, sub.category),
          eq(stockItems.subcategory, sub.slug)
        )
      )
      .limit(1);

    if (itemsUsingSub.length > 0) {
      return NextResponse.json(
        { error: `Cannot remove "${sub.name}" because it contains active stock items.` },
        { status: 400 }
      );
    }

    await db.delete(stockSubcategories).where(eq(stockSubcategories.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
