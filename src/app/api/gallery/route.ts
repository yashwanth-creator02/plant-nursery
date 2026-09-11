import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { stockItems, stockItemImages } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category")?.trim();
    const filter = searchParams.get("filter")?.trim(); // "all" | "with-photos" | "needs-photos"

    // Fetch all stock items with their images
    const items = await db.query.stockItems.findMany({
      orderBy: [asc(stockItems.name)],
      with: {
        images: {
          orderBy: [desc(stockItemImages.isPrimary), desc(stockItemImages.createdAt)],
        },
      },
    });

    let filtered = items;

    // Filter by search term
    if (q) {
      const lowerQ = q.toLowerCase();
      filtered = filtered.filter((item) => {
        const matchesName = item.name.toLowerCase().includes(lowerQ);
        const matchesCategory = item.category.toLowerCase().includes(lowerQ);
        const matchesSubcategory = item.subcategory?.toLowerCase().includes(lowerQ);
        const matchesItemDesc = item.description?.toLowerCase().includes(lowerQ);
        const matchesImageDesc = item.images.some((img) =>
          img.description?.toLowerCase().includes(lowerQ)
        );
        return matchesName || matchesCategory || matchesSubcategory || matchesItemDesc || matchesImageDesc;
      });
    }

    // Filter by category
    if (category && category !== "all") {
      filtered = filtered.filter((item) => item.category === category);
    }

    // Filter by photo status
    if (filter === "with-photos") {
      filtered = filtered.filter((item) => item.images.length > 0);
    } else if (filter === "needs-photos") {
      filtered = filtered.filter((item) => item.images.length === 0);
    }

    return NextResponse.json({
      items: filtered,
      totalCount: items.length,
      withPhotosCount: items.filter((i) => i.images.length > 0).length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
