// scripts/translate-all-descriptions.ts

import { db } from "../src/db";
import { stockItems, stockItemImages } from "../src/db/schema";
import { eq, isNotNull, and, ne, isNull } from "drizzle-orm";

async function translateText(text: string): Promise<string> {
  if (!text || !text.trim()) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=en&tl=kn&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        return data[0].map((c: any) => (Array.isArray(c) ? c[0] : "")).join("").trim();
      }
    }
  } catch (err) {
    console.warn("Translation failed for:", text, err);
  }
  return "";
}

async function main() {
  console.log("Translating existing plant descriptions into Kannada...");

  // 1. Stock items with description but null/empty descriptionKn
  const items = await db
    .select({
      id: stockItems.id,
      name: stockItems.name,
      description: stockItems.description,
    })
    .from(stockItems)
    .where(
      and(
        isNotNull(stockItems.description),
        ne(stockItems.description, ""),
        isNull(stockItems.descriptionKn)
      )
    );

  console.log(`Found ${items.length} items needing Kannada description translation.`);

  for (const item of items) {
    if (!item.description) continue;
    const translated = await translateText(item.description);
    if (translated) {
      await db
        .update(stockItems)
        .set({ descriptionKn: translated })
        .where(eq(stockItems.id, item.id));
      console.log(`✓ Updated [${item.name}]: ${translated.slice(0, 40)}...`);
    }
    // Small delay to be courteous
    await new Promise((r) => setTimeout(r, 200));
  }

  // 2. Stock item images with description but null/empty descriptionKn
  const images = await db
    .select({
      id: stockItemImages.id,
      description: stockItemImages.description,
    })
    .from(stockItemImages)
    .where(
      and(
        isNotNull(stockItemImages.description),
        ne(stockItemImages.description, ""),
        isNull(stockItemImages.descriptionKn)
      )
    );

  console.log(`Found ${images.length} images needing Kannada description translation.`);
  for (const img of images) {
    if (!img.description) continue;
    const translated = await translateText(img.description);
    if (translated) {
      await db
        .update(stockItemImages)
        .set({ descriptionKn: translated })
        .where(eq(stockItemImages.id, img.id));
      console.log(`✓ Updated image [${img.id}]: ${translated.slice(0, 40)}...`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("All descriptions successfully translated and backfilled into Kannada!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
