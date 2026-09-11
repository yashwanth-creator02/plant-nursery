import { NextRequest, NextResponse } from "next/server";
import { asc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stockCategories, stockItems, stockSubcategories } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

function slugify(text: string): string {
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || `cat-${Date.now()}`;
}

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
});

const updateCategorySchema = z.object({
  id: z.string().uuid("Invalid ID"),
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
});

export async function GET() {
  try {
    await requireUser();
    let categories = await db
      .select()
      .from(stockCategories)
      .orderBy(asc(stockCategories.createdAt));

    if (categories.length === 0) {
      await db
        .insert(stockCategories)
        .values([
          { name: "Plants", slug: "plants" },
          { name: "Non-Plants", slug: "non-plants" },
        ])
        .onConflictDoNothing();

      categories = await db
        .select()
        .from(stockCategories)
        .orderBy(asc(stockCategories.createdAt));
    }

    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const { name } = parsed.data;
    const slug = slugify(name);

    const existing = await db
      .select()
      .from(stockCategories)
      .where(ilike(stockCategories.name, name));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `"${name}" category already exists` },
        { status: 400 }
      );
    }

    const [category] = await db
      .insert(stockCategories)
      .values({ name, slug })
      .returning();

    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }
    const { id, name } = parsed.data;

    const [existing] = await db
      .select()
      .from(stockCategories)
      .where(eq(stockCategories.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(stockCategories)
      .set({ name })
      .where(eq(stockCategories.id, id))
      .returning();

    return NextResponse.json({ category: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins are allowed to delete major categories." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const reassignTo = searchParams.get("reassignTo")?.trim();

    if (!id) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    const [cat] = await db
      .select()
      .from(stockCategories)
      .where(eq(stockCategories.id, id));

    if (!cat) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check how many items use this category
    const itemsUsingCat = await db
      .select({ id: stockItems.id })
      .from(stockItems)
      .where(eq(stockItems.category, cat.slug));

    const count = itemsUsingCat.length;

    if (count > 0) {
      if (!reassignTo) {
        return NextResponse.json(
          {
            error: `Cannot remove "${cat.name}" because it contains ${count} active stock item(s).`,
            itemCount: count,
            requiresReassignment: true,
            categoryId: cat.id,
            categoryName: cat.name,
            categorySlug: cat.slug,
          },
          { status: 400 }
        );
      }

      const isOthersTarget =
        reassignTo.toLowerCase() === "others" || reassignTo.toLowerCase() === "other";
      const targetSlug = isOthersTarget ? "others" : reassignTo;

      // Ensure destination category exists (create 'Others' dynamically at this level if needed)
      let [targetCat] = await db
        .select()
        .from(stockCategories)
        .where(
          or(
            eq(stockCategories.slug, targetSlug),
            ilike(stockCategories.name, isOthersTarget ? "others" : targetSlug)
          )
        );

      if (!targetCat && isOthersTarget) {
        [targetCat] = await db
          .insert(stockCategories)
          .values({
            name: "Others",
            slug: "others",
          })
          .onConflictDoNothing()
          .returning();

        if (!targetCat) {
          [targetCat] = await db
            .select()
            .from(stockCategories)
            .where(eq(stockCategories.slug, "others"));
        }
      }

      const destinationCatSlug = targetCat?.slug || targetSlug;

      // Ensure an "Others" subcategory exists under the destination category
      await db
        .insert(stockSubcategories)
        .values({
          category: destinationCatSlug,
          name: "Others",
          slug: "other",
        })
        .onConflictDoNothing();

      // Reassign all active items from cat.slug to destinationCatSlug
      await db
        .update(stockItems)
        .set({ category: destinationCatSlug, subcategory: "other" })
        .where(eq(stockItems.category, cat.slug));

      // Clean up orphan subcategories from the deleted category
      await db
        .delete(stockSubcategories)
        .where(eq(stockSubcategories.category, cat.slug));
    } else {
      await db
        .delete(stockSubcategories)
        .where(eq(stockSubcategories.category, cat.slug));
    }

    await db.delete(stockCategories).where(eq(stockCategories.id, id));
    return NextResponse.json({ ok: true, reassignedCount: count });
  } catch (err) {
    return handleApiError(err);
  }
}
