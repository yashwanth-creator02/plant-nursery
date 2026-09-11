import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stockItems, stockItemImages } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-utils";
import { uploadStockImage } from "@/lib/supabase-storage";

export async function POST(req: NextRequest) {
  try {
    await requireUser();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const stockItemId = formData.get("stockItemId") as string | null;
    const description = (formData.get("description") as string | null)?.trim() || null;
    const isPrimaryRaw = formData.get("isPrimary");

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    if (!stockItemId) {
      return NextResponse.json(
        { error: "Stock item ID is required." },
        { status: 400 }
      );
    }

    // Verify stock item exists
    const [item] = await db
      .select()
      .from(stockItems)
      .where(eq(stockItems.id, stockItemId))
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: "Selected stock item not found." },
        { status: 404 }
      );
    }

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files (JPG, PNG, WebP, etc.) are supported." },
        { status: 400 }
      );
    }

    // Max 15MB limit
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be under 15MB." },
        { status: 400 }
      );
    }

    // Check if item already has images
    const existingImages = await db
      .select({ id: stockItemImages.id })
      .from(stockItemImages)
      .where(eq(stockItemImages.stockItemId, stockItemId));

    const isFirstImage = existingImages.length === 0;
    const shouldBePrimary = isFirstImage || isPrimaryRaw === "true";

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { imageUrl, storagePath } = await uploadStockImage({
      fileBuffer: buffer,
      fileName: file.name || "photo.jpg",
      contentType: file.type || "image/jpeg",
      stockItemId,
    });

    // If making primary, demote existing primary images
    if (shouldBePrimary && existingImages.length > 0) {
      await db
        .update(stockItemImages)
        .set({ isPrimary: false })
        .where(eq(stockItemImages.stockItemId, stockItemId));
    }

    // Insert database record
    const [newImage] = await db
      .insert(stockItemImages)
      .values({
        stockItemId,
        imageUrl,
        storagePath,
        description,
        isPrimary: shouldBePrimary,
      })
      .returning();

    return NextResponse.json({
      success: true,
      image: newImage,
      item: {
        id: item.id,
        name: item.name,
      },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return handleApiError(err);
  }
}
