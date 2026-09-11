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
  category: z.string().trim().min(1, "Category is required"),
});

const updateSubcategorySchema = z.object({
  id: z.string().uuid("Invalid ID"),
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
});

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get("category");

    let query = db.select().from(stockSubcategories).$dynamic();
    if (categoryParam && categoryParam !== "all") {
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
        { error: `"${name}" subcategory already exists in this category` },
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

export async function PATCH(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = updateSubcategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }
    const { id, name } = parsed.data;

    const [existing] = await db
      .select()
      .from(stockSubcategories)
      .where(eq(stockSubcategories.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(stockSubcategories)
      .set({ name })
      .where(eq(stockSubcategories.id, id))
      .returning();

    return NextResponse.json({ subcategory: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins are allowed to delete subcategories." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const reassignTo = searchParams.get("reassignTo")?.trim();

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

    // Check how many items use this subcategory
    const itemsUsingSub = await db
      .select({ id: stockItems.id })
      .from(stockItems)
      .where(
        and(
          eq(stockItems.category, sub.category),
          eq(stockItems.subcategory, sub.slug)
        )
      );

    const count = itemsUsingSub.length;

    if (count > 0) {
      if (!reassignTo) {
        return NextResponse.json(
          {
            error: `Cannot remove "${sub.name}" because it contains ${count} active stock item(s).`,
            itemCount: count,
            requiresReassignment: true,
            subcategoryId: sub.id,
            subcategoryName: sub.name,
            category: sub.category,
          },
          { status: 400 }
        );
      }

      // Reassign items to destination subcategory
      await db
        .update(stockItems)
        .set({ subcategory: reassignTo })
        .where(
          and(
            eq(stockItems.category, sub.category),
            eq(stockItems.subcategory, sub.slug)
          )
        );
    }

    await db.delete(stockSubcategories).where(eq(stockSubcategories.id, id));
    return NextResponse.json({ ok: true, reassignedCount: count });
  } catch (err) {
    return handleApiError(err);
  }
}
