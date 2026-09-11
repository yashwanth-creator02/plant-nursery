import "dotenv/config";
import { eq, or, ilike } from "drizzle-orm";
import { db } from "../src/db";
import { stockItems } from "../src/db/schema";

interface PlantEntry {
  number: number;
  kannadaName: string;
  englishName: string;
  category: "plants";
  subcategory: string;
  price: string;
  quantity: number;
  unit: string;
  description: string;
}

const plantList: PlantEntry[] = [
  {
    number: 33,
    kannadaName: "ಜಮ್ ನೇರಳೆ",
    englishName: "Jam Nerale (Jamun Jam Variety)",
    category: "plants",
    subcategory: "fruit",
    price: "150.00",
    quantity: 25,
    unit: "pcs",
    description:
      "Sweet and fleshy purple jamun (black plum) variety with rich antioxidant properties, ideal for direct consumption, juice, and fruit jam making.",
  },
  {
    number: 34,
    kannadaName: "ವೈಟ್ ನೇರಳೆ",
    englishName: "White Nerale (White Jamun)",
    category: "plants",
    subcategory: "fruit",
    price: "180.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Rare white-fruited jamun cultivar producing sweet, succulent, wax-like fruits known for traditional wellness and diabetic dietary benefits.",
  },
  {
    number: 35,
    kannadaName: "ಸೀಡ್‌ಲೆಸ್ ನೇರಳೆ",
    englishName: "Seedless Nerale (Seedless Jamun)",
    category: "plants",
    subcategory: "fruit",
    price: "220.00",
    quantity: 20,
    unit: "pcs",
    description:
      "High-yielding seedless blackberry tree bearing plump dark-purple fruits with 100% tender edible pulp and exceptional flavor.",
  },
  {
    number: 36,
    kannadaName: "ನೇರಳೆ ಜ್ಯೂಸ್",
    englishName: "Nerale Juice (Juice Jamun)",
    category: "plants",
    subcategory: "fruit",
    price: "150.00",
    quantity: 25,
    unit: "pcs",
    description:
      "Extra-pulpy and juicy jamun variety selected specifically for fresh nectar preparation, health tonics, and commercial beverage extraction.",
  },
  {
    number: 37,
    kannadaName: "ಸೀತಾಫಲ",
    englishName: "Seethaphala (Custard Apple / Sugar Apple)",
    category: "plants",
    subcategory: "fruit",
    price: "120.00",
    quantity: 30,
    unit: "pcs",
    description:
      "Annona squamosa tree producing sweet, creamy, aromatic fruits with granular white custard pulp rich in vitamin C and essential minerals.",
  },
  {
    number: 38,
    kannadaName: "ರಾಮಫಲ",
    englishName: "Ramaphala (Ramphal / Bullock's Heart)",
    category: "plants",
    subcategory: "fruit",
    price: "150.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Annona reticulata featuring heart-shaped, smooth brownish-red fruits with sweet, velvety custard pulp beneficial for immune health.",
  },
  {
    number: 39,
    kannadaName: "ಲಕ್ಷ್ಮಣ ಫಲ",
    englishName: "Lakshmana Phala (Lakshman Phal / Soursop)",
    category: "plants",
    subcategory: "fruit",
    price: "250.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Annona muricata (Graviola/Soursop) producing spiny green fruits with aromatic, creamy, citrus-strawberry flavored pulp prized for medicinal properties.",
  },
  {
    number: 40,
    kannadaName: "ಹನುಮ ಫಲ",
    englishName: "Hanuma Phala (Hanuman Phal / Cherimoya)",
    category: "plants",
    subcategory: "fruit",
    price: "200.00",
    quantity: 15,
    unit: "pcs",
    description:
      "Exotic highland Annona cultivar with smooth velvety texture and delicious tropical flavor combining pineapple, banana, and strawberry notes.",
  },
  {
    number: 41,
    kannadaName: "ಬೆಟ್ಟದ ನೆಲ್ಲಿಕಾಯಿ",
    englishName: "Bettada Nellikayi (Indian Gooseberry / Wild Amla)",
    category: "plants",
    subcategory: "fruit",
    price: "100.00",
    quantity: 35,
    unit: "pcs",
    description:
      "Phyllanthus emblica (Amla) yielding round green medicinal fruits packed with natural vitamin C, tannins, and potent Ayurvedic properties.",
  },
  {
    number: 42,
    kannadaName: "ಕಾಯಿ ನೆಲ್ಲಿ",
    englishName: "Kayi Nelli (Star Gooseberry)",
    category: "plants",
    subcategory: "fruit",
    price: "100.00",
    quantity: 25,
    unit: "pcs",
    description:
      "Phyllanthus acidus producing prolific hanging clusters of pale-yellow, ribbed tart berries perfect for pickles, preserves, and culinary souring.",
  },
  {
    number: 43,
    kannadaName: "ರೆಡ್ ನೆಲ್ಲಿಕಾಯಿ",
    englishName: "Red Nellikayi (Red Amla / Red Gooseberry)",
    category: "plants",
    subcategory: "fruit",
    price: "150.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Unique reddish-fruited gooseberry cultivar with ornamental foliage and anthocyanin-rich tart fruits suitable for edible landscaping.",
  },
  {
    number: 44,
    kannadaName: "ಗಮ್‌ಲೆಸ್ ಹಲಸು",
    englishName: "Gumless Halasu (Gumless Jackfruit)",
    category: "plants",
    subcategory: "fruit",
    price: "250.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Modern grafted jackfruit cultivar producing sweet, crunchy carpels with virtually no sticky latex gum, making peeling and serving effortless.",
  },
  {
    number: 45,
    kannadaName: "ರೆಡ್ ಹಲಸು",
    englishName: "Red Halasu (Red Jackfruit / Lal Halasu)",
    category: "plants",
    subcategory: "fruit",
    price: "250.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Premium jackfruit variety bearing vibrant copper-red bulbs with sweet honeyed flavor, appealing aroma, and high beta-carotene levels.",
  },
  {
    number: 46,
    kannadaName: "ಹನಿ ವೆರೈಟಿ",
    englishName: "Honey Variety Halasu (Honey Jackfruit)",
    category: "plants",
    subcategory: "fruit",
    price: "220.00",
    quantity: 25,
    unit: "pcs",
    description:
      "Sweet-fleshed jackfruit tree prized for thick, golden-yellow carpels filled with delicious, nectar-like honey sweetness.",
  },
  {
    number: 47,
    kannadaName: "ಸಿದ್ದು ಹಲಸು",
    englishName: "Siddu Halasu (Siddu Red Jackfruit)",
    category: "plants",
    subcategory: "fruit",
    price: "300.00",
    quantity: 25,
    unit: "pcs",
    description:
      "Nationally recognized, award-winning Karnataka jackfruit variety with distinctive coppery-red, highly nutritious sweet bulbs and firm texture.",
  },
  {
    number: 48,
    kannadaName: "ಶಂಕರ ಹಲಸು",
    englishName: "Shankara Halasu (Shankara Jackfruit)",
    category: "plants",
    subcategory: "fruit",
    price: "250.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Popular commercial grafted jackfruit producing uniform, sweet and crunchy flakes suitable for both home gardens and commercial orchards.",
  },
  {
    number: 49,
    kannadaName: "ಮಂಕಾಳಿ ರೆಡ್ ಹಲಸು",
    englishName: "Mankali Red Halasu (Mankale Red Jackfruit)",
    category: "plants",
    subcategory: "fruit",
    price: "250.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Traditional Karnataka red-flake jackfruit variety known for deep orange-red bulbs, high natural sugar content, and strong tree vigor.",
  },
  {
    number: 51,
    kannadaName: "ವಿಯೆಟ್ನಾಮ್ ಸೂಪರ್ ಅರ್ಲಿ",
    englishName: "Vietnam Super Early Jackfruit",
    category: "plants",
    subcategory: "fruit",
    price: "280.00",
    quantity: 25,
    unit: "pcs",
    description:
      "Dwarf, fast-bearing hybrid jackfruit tree that begins producing fruits within 18 to 24 months, ideal for compact gardens and container growing.",
  },
  {
    number: 52,
    kannadaName: "ರುದ್ರಾಕ್ಷಿ ಹಲಸು",
    englishName: "Rudrakshi Halasu (Rudrakshi Jackfruit)",
    category: "plants",
    subcategory: "fruit",
    price: "200.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Distinctive small round-fruited jackfruit variety with minimal spines, mild pleasant sweetness, and high proportion of edible carpels.",
  },
  {
    number: 53,
    kannadaName: "ಪ್ರಕಾಶ್ ಚಂದ್ರ ಹಲಸು",
    englishName: "Prakash Chandra Halasu (Prakash Chandra Jackfruit)",
    category: "plants",
    subcategory: "fruit",
    price: "250.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Farmer-selected grafted jackfruit clone recognized for high fruit-bearing density, crisp bulbs, low fibrous rag, and superb taste.",
  },
  {
    number: 54,
    kannadaName: "ಜಿಗುಚ್",
    englishName: "Jiguj (Breadfruit / Nir Halasu)",
    category: "plants",
    subcategory: "fruit",
    price: "180.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Artocarpus altilis (Breadfruit) producing large starchy, carbohydrate-rich fruits widely used in coastal Karnataka curries, fries, and roasts.",
  },
  {
    number: 55,
    kannadaName: "ಬಿಂಬಾಳಕ್",
    englishName: "Bimbalak (Bilimbi / Tree Sorrel)",
    category: "plants",
    subcategory: "fruit",
    price: "120.00",
    quantity: 25,
    unit: "pcs",
    description:
      "Averrhoa bilimbi tree bearing clusters of intensely tangy, crunchy green fruits along the trunk, prized for authentic pickles and curries.",
  },
  {
    number: 56,
    kannadaName: "ತೈವಾನ್ ವೈಟ್ ಪೇರಳೆ",
    englishName: "Taiwan White Perale (Taiwan White Guava)",
    category: "plants",
    subcategory: "fruit",
    price: "150.00",
    quantity: 30,
    unit: "pcs",
    description:
      "High-yielding commercial guava variety bearing large crisp fruits with snowy white, sweet pulp and very few soft seeds.",
  },
  {
    number: 57,
    kannadaName: "ರೆಡ್ ಪೇರಳೆ",
    englishName: "Red Perale (Red Guava / Pink Guava)",
    category: "plants",
    subcategory: "fruit",
    price: "150.00",
    quantity: 30,
    unit: "pcs",
    description:
      "Tropical guava variety with aromatic pinkish-red interior flesh, sweet musky fragrance, and rich lycopene antioxidant content.",
  },
  {
    number: 58,
    kannadaName: "K.G. ಪೇರಳೆ",
    englishName: "K.G. Perale (KG Guava / Jumbo Guava)",
    category: "plants",
    subcategory: "fruit",
    price: "180.00",
    quantity: 25,
    unit: "pcs",
    description:
      "Celebrated jumbo guava producing massive fruits weighing up to 500g to 1kg each, featuring crisp sweet flesh and excellent market demand.",
  },
  {
    number: 59,
    kannadaName: "ಅಲಹಾಬಾದ್ ಪೇರಳೆ",
    englishName: "Allahabad Perale (Allahabad Safeda Guava)",
    category: "plants",
    subcategory: "fruit",
    price: "140.00",
    quantity: 30,
    unit: "pcs",
    description:
      "Classic Indian guava benchmark variety producing round, smooth-skinned fruits with pleasant sweet white pulp and heavenly aroma.",
  },
  {
    number: 60,
    kannadaName: "ಮಪೀಲ್ ಪೇರಳೆ",
    englishName: "Purple / Maple Perale (Purple Guava)",
    category: "plants",
    subcategory: "fruit",
    price: "180.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Stunning ornamental and edible guava featuring dark purple-bronze leaves, pink blossoms, and fragrant dark maroon sweet fruits.",
  },
  {
    number: 61,
    kannadaName: "ಚೈನೀಸ್ ಸ್ಟ್ರಾಬೆರಿ ಪೇರಳೆ",
    englishName: "Chinese Strawberry Perale (Strawberry Guava)",
    category: "plants",
    subcategory: "fruit",
    price: "180.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Psidium cattleyanum producing abundant small crimson fruits with a delightful blended flavor of wild strawberry and tropical guava.",
  },
  {
    number: 62,
    kannadaName: "ಸೀಡ್‌ಲೆಸ್ ಕೆಎಮ್‌ಎಲ್ ಪೇರಳೆ",
    englishName: "Seedless Diamond Perale (Seedless Diamond Guava)",
    category: "plants",
    subcategory: "fruit",
    price: "200.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Premium table guava variety with crisp crunchy sweet flesh that is 100% free of hard seeds, perfect for fresh fruit snacking.",
  },
  {
    number: 63,
    kannadaName: "ವ್ಯಾಕ್ಸ್ ಆಪಲ್ ವೈಟ್, ರೆಡ್",
    englishName: "Wax Apple White & Red (Water Apple)",
    category: "plants",
    subcategory: "fruit",
    price: "200.00",
    quantity: 25,
    unit: "pcs",
    description:
      "Syzygium samarangense bell-shaped crisp fruits with translucent thirst-quenching flesh, available in vibrant sweet red and crisp white types.",
  },
  {
    number: 64,
    kannadaName: "ಮಲಯನ್ ಆಪಲ್",
    englishName: "Malayan Apple (Malay Apple / Mountain Apple)",
    category: "plants",
    subcategory: "fruit",
    price: "220.00",
    quantity: 20,
    unit: "pcs",
    description:
      "Syzygium malaccense featuring deep red to purple pear-shaped fruits with crisp, juicy, mildly fragrant white flesh and high ornamental value.",
  },
];

async function main() {
  console.log("=== Cleaning up nonsense data and seeding plant items ===");

  // 1. Remove nonsense items
  console.log("1. Removing nonsense test data...");
  const deletedMghm = await db
    .delete(stockItems)
    .where(eq(stockItems.name, "mghm"))
    .returning();
  if (deletedMghm.length > 0) {
    console.log(`Deleted nonsense item "mghm" (id: ${deletedMghm[0].id})`);
  }

  // 2. Fix typos on existing items
  console.log("2. Correcting unit typos on existing items...");
  await db
    .update(stockItems)
    .set({ unit: "pcs" })
    .where(eq(stockItems.unit, "pcspcs"));

  // 3. Insert or update all plant items
  console.log(`3. Seeding ${plantList.length} translated plant items...`);
  let addedCount = 0;
  let updatedCount = 0;

  for (const plant of plantList) {
    // Check if an item with similar name already exists
    const existing = await db
      .select()
      .from(stockItems)
      .where(
        or(
          eq(stockItems.name, plant.englishName),
          ilike(stockItems.name, `%${plant.kannadaName}%`)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(stockItems)
        .set({
          name: plant.englishName,
          category: plant.category,
          subcategory: plant.subcategory,
          price: plant.price,
          quantity: plant.quantity,
          unit: plant.unit,
          description: plant.description,
          updatedAt: new Date(),
        })
        .where(eq(stockItems.id, existing[0].id));
      updatedCount++;
    } else {
      await db.insert(stockItems).values({
        name: plant.englishName,
        category: plant.category,
        subcategory: plant.subcategory,
        price: plant.price,
        quantity: plant.quantity,
        unit: plant.unit,
        description: plant.description,
      });
      addedCount++;
    }
  }

  console.log(`\nSuccessfully processed plants!`);
  console.log(`- Newly added: ${addedCount}`);
  console.log(`- Updated: ${updatedCount}`);
  console.log(`- Total plants in list: ${plantList.length}`);

  // Query final list
  const allItems = await db.select().from(stockItems);
  console.log(`Total stock items now in database: ${allItems.length}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding plants:", err);
  process.exit(1);
});
