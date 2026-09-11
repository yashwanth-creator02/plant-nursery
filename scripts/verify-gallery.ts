import "dotenv/config";
import { db } from "../src/db";
import { stockItems, stockItemImages } from "../src/db/schema";
import { eq, desc } from "drizzle-orm";

async function verify() {
  console.log("Verifying Database Schema & Relations for Gallery...");

  // 1. Get or create a sample stock item
  let [item] = await db.select().from(stockItems).limit(1);
  if (!item) {
    console.log("No stock items found, creating a test item...");
    [item] = await db
      .insert(stockItems)
      .values({
        name: "Test Hibiscus Plant",
        price: "150.00",
        quantity: 25,
        category: "plants",
        subcategory: "flower",
      })
      .returning();
  }
  console.log(`Using stock item: "${item.name}" (${item.id})`);

  // 2. Insert test image record
  const [testImg] = await db
    .insert(stockItemImages)
    .values({
      stockItemId: item.id,
      imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop",
      storagePath: `items/${item.id}/test.jpg`,
      description: "Bright red flowering variety in full bloom with glossy foliage.",
      isPrimary: true,
    })
    .returning();
  console.log(`Inserted test image record: ${testImg.id}`);

  // 3. Query using Drizzle relation
  const queriedItem = await db.query.stockItems.findFirst({
    where: eq(stockItems.id, item.id),
    with: {
      images: {
        orderBy: [desc(stockItemImages.isPrimary)],
      },
    },
  });

  if (!queriedItem || !queriedItem.images || queriedItem.images.length === 0) {
    throw new Error("Failed to query stock item with images relation!");
  }

  console.log(`Relation test successful! Found item with ${queriedItem.images.length} images.`);
  console.log(`Image description: "${queriedItem.images[0].description}"`);

  // 4. Clean up test image
  await db.delete(stockItemImages).where(eq(stockItemImages.id, testImg.id));
  console.log("Cleaned up test image record successfully!");

  console.log("\nAll Database & Gallery Relation checks passed!");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
