import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stockItemImages } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { deleteStorageFile } from "@/lib/supabase-storage";

const patchSchema = z.object({
  description: z.string().trim().optional(),
  isPrimary: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => null);

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(stockItemImages)
      .where(eq(stockItemImages.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // If making this primary, demote other images for this stock item
    if (parsed.data.isPrimary) {
      await db
        .update(stockItemImages)
        .set({ isPrimary: false })
        .where(eq(stockItemImages.stockItemId, existing.stockItemId));
    }

    const [updated] = await db
      .update(stockItemImages)
      .set({
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description,
        }),
        ...(parsed.data.isPrimary !== undefined && {
          isPrimary: parsed.data.isPrimary,
        }),
      })
      .where(eq(stockItemImages.id, id))
      .returning();

    return NextResponse.json({ image: updated });
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

    const [image] = await db
      .select()
      .from(stockItemImages)
      .where(eq(stockItemImages.id, id))
      .limit(1);

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // 1. Remove from Supabase Storage
    await deleteStorageFile(image.storagePath);

    // 2. Remove from database
    await db.delete(stockItemImages).where(eq(stockItemImages.id, id));

    // 3. If this was primary, promote the most recent remaining image to primary
    if (image.isPrimary) {
      const [nextPrimary] = await db
        .select()
        .from(stockItemImages)
        .where(eq(stockItemImages.stockItemId, image.stockItemId))
        .limit(1);

      if (nextPrimary) {
        await db
          .update(stockItemImages)
          .set({ isPrimary: true })
          .where(eq(stockItemImages.id, nextPrimary.id));
      }
    }

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err) {
    return handleApiError(err);
  }
}
