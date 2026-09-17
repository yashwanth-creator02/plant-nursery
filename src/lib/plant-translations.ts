// src/lib/plant-translations.ts

import { Language } from "./language-context";

export interface PlantMapping {
  kannada: string;
  english: string;
  aliases?: string[];
}

export const PLANT_DICTIONARY: PlantMapping[] = [
  // Fruits & Specimen Trees from Nursery Seed Catalog
  {
    kannada: "ಜಮ್ ನೇರಳೆ",
    english: "Jam Nerale (Jamun Jam Variety)",
    aliases: ["Jam Nerale", "Jamun Jam", "Jamun", "Nerale"],
  },
  {
    kannada: "ವೈಟ್ ನೇರಳೆ",
    english: "White Nerale (White Jamun)",
    aliases: ["White Nerale", "White Jamun"],
  },
  {
    kannada: "ಸೀಡ್‌ಲೆಸ್ ನೇರಳೆ",
    english: "Seedless Nerale (Seedless Jamun)",
    aliases: ["Seedless Nerale", "Seedless Jamun"],
  },
  {
    kannada: "ನೇರಳೆ ಜ್ಯೂಸ್",
    english: "Nerale Juice (Juice Jamun)",
    aliases: ["Nerale Juice", "Juice Jamun"],
  },
  {
    kannada: "ಸೀತಾಫಲ",
    english: "Seethaphala (Custard Apple / Sugar Apple)",
    aliases: ["Seethaphala", "Custard Apple", "Sugar Apple", "Sitaphal"],
  },
  {
    kannada: "ರಾಮಫಲ",
    english: "Ramaphala (Ramphal / Bullock's Heart)",
    aliases: ["Ramaphala", "Ramphal", "Bullock's Heart"],
  },
  {
    kannada: "ಲಕ್ಷ್ಮಣ ಫಲ",
    english: "Lakshmana Phala (Lakshman Phal / Soursop)",
    aliases: ["Lakshmana Phala", "Lakshman Phal", "Soursop", "Graviola"],
  },
  {
    kannada: "ಹನುಮ ಫಲ",
    english: "Hanuma Phala (Hanuman Phal / Cherimoya)",
    aliases: ["Hanuma Phala", "Hanuman Phal", "Cherimoya"],
  },
  {
    kannada: "ಬೆಟ್ಟದ ನೆಲ್ಲಿಕಾಯಿ",
    english: "Bettada Nellikayi (Indian Gooseberry / Wild Amla)",
    aliases: ["Bettada Nellikayi", "Indian Gooseberry", "Amla", "Wild Amla", "Nellikayi"],
  },
  {
    kannada: "ಕಾಯಿ ನೆಲ್ಲಿ",
    english: "Kayi Nelli (Star Gooseberry)",
    aliases: ["Kayi Nelli", "Star Gooseberry"],
  },
  {
    kannada: "ರೆಡ್ ನೆಲ್ಲಿಕಾಯಿ",
    english: "Red Nellikayi (Red Amla / Red Gooseberry)",
    aliases: ["Red Nellikayi", "Red Amla", "Red Gooseberry"],
  },
  {
    kannada: "ಗಮ್‌ಲೆಸ್ ಹಲಸು",
    english: "Gumless Halasu (Gumless Jackfruit)",
    aliases: ["Gumless Halasu", "Gumless Jackfruit", "Halasu"],
  },
  {
    kannada: "ರೆಡ್ ಹಲಸು",
    english: "Red Halasu (Red Jackfruit / Lal Halasu)",
    aliases: ["Red Halasu", "Red Jackfruit", "Lal Halasu"],
  },
  {
    kannada: "ಹನಿ ವೆರೈಟಿ ಹಲಸು",
    english: "Honey Variety Halasu (Honey Jackfruit)",
    aliases: ["Honey Variety Halasu", "Honey Jackfruit", "Honey Halasu"],
  },
  {
    kannada: "ಸಿದ್ದು ಹಲಸು",
    english: "Siddu Halasu (Siddu Red Jackfruit)",
    aliases: ["Siddu Halasu", "Siddu Red Jackfruit", "Siddu Jackfruit"],
  },
  {
    kannada: "ಶಂಕರ ಹಲಸು",
    english: "Shankara Halasu (Shankara Jackfruit)",
    aliases: ["Shankara Halasu", "Shankara Jackfruit"],
  },
  {
    kannada: "ಮಂಕಾಳಿ ರೆಡ್ ಹಲಸು",
    english: "Mankali Red Halasu (Mankale Red Jackfruit)",
    aliases: ["Mankali Red Halasu", "Mankale Red Jackfruit", "Mankali Halasu"],
  },
  {
    kannada: "ವಿಯೆಟ್ನಾಮ್ ಸೂಪರ್ ಅರ್ಲಿ ಹಲಸು",
    english: "Vietnam Super Early Jackfruit",
    aliases: ["Vietnam Super Early", "Vietnam Jackfruit", "Super Early Jackfruit"],
  },
  {
    kannada: "ರುದ್ರಾಕ್ಷಿ ಹಲಸು",
    english: "Rudrakshi Halasu (Rudrakshi Jackfruit)",
    aliases: ["Rudrakshi Halasu", "Rudrakshi Jackfruit"],
  },
  {
    kannada: "ಪ್ರಕಾಶ್ ಚಂದ್ರ ಹಲಸು",
    english: "Prakash Chandra Halasu (Prakash Chandra Jackfruit)",
    aliases: ["Prakash Chandra Halasu", "Prakash Chandra Jackfruit"],
  },
  {
    kannada: "ಜಿಗುಚ್",
    english: "Jiguj (Breadfruit / Nir Halasu)",
    aliases: ["Jiguj", "Breadfruit", "Nir Halasu"],
  },
  {
    kannada: "ಬಿಂಬಾಳಕ್",
    english: "Bimbalak (Bilimbi / Tree Sorrel)",
    aliases: ["Bimbalak", "Bilimbi", "Tree Sorrel"],
  },
  {
    kannada: "ತೈವಾನ್ ವೈಟ್ ಪೇರಳೆ",
    english: "Taiwan White Perale (Taiwan White Guava)",
    aliases: ["Taiwan White Perale", "Taiwan White Guava", "Perale", "Guava"],
  },
  {
    kannada: "ರೆಡ್ ಪೇರಳೆ",
    english: "Red Perale (Red Guava / Pink Guava)",
    aliases: ["Red Perale", "Red Guava", "Pink Guava"],
  },
  {
    kannada: "K.G. ಪೇರಳೆ",
    english: "K.G. Perale (KG Guava / Jumbo Guava)",
    aliases: ["K.G. Perale", "KG Perale", "KG Guava", "Jumbo Guava"],
  },
  {
    kannada: "ಅಲಹಾಬಾದ್ ಪೇರಳೆ",
    english: "Allahabad Perale (Allahabad Safeda Guava)",
    aliases: ["Allahabad Perale", "Allahabad Safeda Guava", "Allahabad Guava"],
  },
  {
    kannada: "ಮಪೀಲ್ ಪೇರಳೆ",
    english: "Purple / Maple Perale (Purple Guava)",
    aliases: ["Purple Perale", "Maple Perale", "Purple Guava"],
  },
  {
    kannada: "ಚೈನೀಸ್ ಸ್ಟ್ರಾಬೆರಿ ಪೇರಳೆ",
    english: "Chinese Strawberry Perale (Strawberry Guava)",
    aliases: ["Chinese Strawberry Perale", "Strawberry Guava"],
  },
  {
    kannada: "ಸೀಡ್‌ಲೆಸ್ ಕೆಎಮ್‌ಎಲ್ ಪೇರಳೆ",
    english: "Seedless Diamond Perale (Seedless Diamond Guava)",
    aliases: ["Seedless Diamond Perale", "Seedless Guava"],
  },
  {
    kannada: "ವ್ಯಾಕ್ಸ್ ಆಪಲ್ ವೈಟ್, ರೆಡ್",
    english: "Wax Apple White & Red (Water Apple)",
    aliases: ["Wax Apple White & Red", "Wax Apple", "Water Apple"],
  },
  {
    kannada: "ಮಲಯನ್ ಆಪಲ್",
    english: "Malayan Apple (Malay Apple / Mountain Apple)",
    aliases: ["Malayan Apple", "Malay Apple", "Mountain Apple"],
  },

  // Common Horticultural & Plantation Plants
  {
    kannada: "ಮಾವಿನ ಗಿಡ",
    english: "Mango Plant (Badami / Alphonso)",
    aliases: ["Mango", "Mango Plant", "Alphonso", "Badami", "Mallika", "Totapuri"],
  },
  {
    kannada: "ತೆಂಗಿನ ಸಸಿ",
    english: "Coconut Seedling (TxD Hybrid)",
    aliases: ["Coconut", "Coconut Seedling", "Tall x Dwarf", "Ganga Bondam"],
  },
  {
    kannada: "ಅಡಿಕೆ ಸಸಿ",
    english: "Arecanut Seedling (Mohitnagar / South Kanara)",
    aliases: ["Arecanut", "Areca Nut", "Betel Nut", "Arecanut Seedling", "Mohitnagar"],
  },
  {
    kannada: "ಸಪೋಟ ಗಿಡ",
    english: "Chikoo / Sapota Plant (Cricket Ball)",
    aliases: ["Chikoo", "Sapota", "Chiku", "Cricket Ball Sapota"],
  },
  {
    kannada: "ದಾಳಿಂಬೆ ಗಿಡ",
    english: "Pomegranate Plant (Bhagwa)",
    aliases: ["Pomegranate", "Pomegranate Plant", "Bhagwa", "Arakta"],
  },
  {
    kannada: "ನಿಂಬೆ ಗಿಡ",
    english: "Lemon / Kagzi Lime Plant",
    aliases: ["Lemon", "Lemon Plant", "Lime", "Kagzi Lime"],
  },
  {
    kannada: "ಕಿತ್ತಳೆ ಗಿಡ",
    english: "Orange Plant (Nagpur Mandarin)",
    aliases: ["Orange", "Orange Plant", "Mandarin", "Coorg Orange"],
  },
  {
    kannada: "ಮೊಸಂಬಿ ಗಿಡ",
    english: "Mosambi Plant (Sweet Lime)",
    aliases: ["Mosambi", "Sweet Lime", "Mosambi Plant"],
  },
  {
    kannada: "ಬಾಳೆ ಸಸಿ",
    english: "Banana Tissue Culture Plantlet (G9)",
    aliases: ["Banana", "Banana Plant", "G9 Banana", "Elakki Banana", "Yelakki"],
  },
  {
    kannada: "ಪರಂಗಿ ಗಿಡ",
    english: "Papaya Seedling (Red Lady 786)",
    aliases: ["Papaya", "Papaya Plant", "Red Lady", "Red Lady 786"],
  },
  {
    kannada: "ತೇಗದ ಮರ",
    english: "Teak Tree Sapling (Burma / Nilambur)",
    aliases: ["Teak", "Teak Tree", "Teak Wood", "Sagavani"],
  },
  {
    kannada: "ಶ್ರೀಗಂಧದ ಗಿಡ",
    english: "Sandalwood Sapling (Santalum album)",
    aliases: ["Sandalwood", "Sandalwood Sapling", "Chandana", "Sri Gandha"],
  },
  {
    kannada: "ರಕ್ತಚಂದನ ಗಿಡ",
    english: "Red Sandalwood Sapling",
    aliases: ["Red Sandalwood", "Red Sanders", "Rakta Chandana"],
  },
  {
    kannada: "ಮಹಾಗನಿ ಗಿಡ",
    english: "Mahogany Sapling",
    aliases: ["Mahogany", "Mahagony", "African Mahogany"],
  },
  {
    kannada: "ಹೆಬ್ಬೇವು ಗಿಡ",
    english: "Melia Dubia Sapling (Hebbevu / Malabar Neem)",
    aliases: ["Melia Dubia", "Hebbevu", "Malabar Neem"],
  },
  {
    kannada: "ಕಾಳುಮೆಣಸು ಗಿಡ",
    english: "Black Pepper Runner (Panniyur 1)",
    aliases: ["Black Pepper", "Pepper Plant", "Panniyur", "Menasu"],
  },
  {
    kannada: "ಏಲಕ್ಕಿ ಗಿಡ",
    english: "Cardamom Plant",
    aliases: ["Cardamom", "Yelakki Plant", "Green Cardamom"],
  },
  {
    kannada: "ಕಾಫಿ ಸಸಿ",
    english: "Coffee Seedling (Arabica / Robusta)",
    aliases: ["Coffee", "Coffee Seedling", "Arabica", "Robusta"],
  },

  // Flowers & Ornamentals
  {
    kannada: "ಗುಲಾಬಿ ಗಿಡ",
    english: "Rose Plant (Assorted Colors)",
    aliases: ["Rose", "Rose Plant", "Dutch Rose", "Button Rose"],
  },
  {
    kannada: "ದಾಸವಾಳ ಗಿಡ",
    english: "Hibiscus Plant (Hybrid)",
    aliases: ["Hibiscus", "Hibiscus Plant", "Shoeblower", "Dasavala"],
  },
  {
    kannada: "ಮಲ್ಲಿಗೆ ಗಿಡ",
    english: "Jasmine Plant (Mysore Mallige / Udupi Mallige)",
    aliases: ["Jasmine", "Jasmine Plant", "Mallige", "Mysore Mallige", "Udupi Mallige"],
  },
  {
    kannada: "ಸಂಪಿಗೆ ಗಿಡ",
    english: "Champaca / Sampige Plant",
    aliases: ["Sampige", "Champaca", "Golden Champa"],
  },
  {
    kannada: "ಬೋಗನ್‌ವಿಲ್ಲಾ",
    english: "Bougainvillea (Paper Flower)",
    aliases: ["Bougainvillea", "Bouganvilla", "Paper Flower"],
  },

  // Herbal & Medicinal Plants
  {
    kannada: "ಅಮೃತಬಳ್ಳಿ",
    english: "Amruthaballi (Giloy / Guduchi)",
    aliases: ["Amruthaballi", "Amrutha Balli", "Amruthavalli", "Giloy", "Guduchi", "Tinospora cordifolia"],
  },
  {
    kannada: "ತುಳಸಿ ಗಿಡ",
    english: "Tulasi Plant (Holy Basil)",
    aliases: ["Tulasi", "Tulsi", "Krishna Tulasi", "Rama Tulasi", "Holy Basil"],
  },
  {
    kannada: "ದೊಡ್ಡಪತ್ರೆ ಗಿಡ",
    english: "Doddapatre (Mexican Mint / Ajwain Leaves)",
    aliases: ["Doddapatre", "Dodda Pathre", "Ajwain Leaf", "Mexican Mint", "Coleus amboinicus"],
  },
  {
    kannada: "ಕರಿಬೇವು ಗಿಡ",
    english: "Curry Leaves Plant (Karibevu)",
    aliases: ["Curry Leaves", "Karibevu", "Karivepaku", "Curry Leaf Plant"],
  },
  {
    kannada: "ಲೆಮನ್ ಗ್ರಾಸ್ ಗಿಡ",
    english: "Lemon Grass (Nimbe Hullu)",
    aliases: ["Lemon Grass", "Lemongrass", "Nimbe Hullu"],
  },
  {
    kannada: "ಬ್ರಾಹ್ಮಿ / ಒಂದೆಲಗ ಗಿಡ",
    english: "Brahmi / Ondelaga Plant",
    aliases: ["Brahmi", "Ondelaga", "Gotu Kola", "Centella asiatica"],
  },
  {
    kannada: "ಇನ್ಸುಲಿನ್ ಗಿಡ",
    english: "Insulin Plant (Costus Igneus)",
    aliases: ["Insulin Plant", "Insulin Gida", "Costus Igneus"],
  },
  {
    kannada: "ಅಶ್ವಗಂಧ ಗಿಡ",
    english: "Ashwagandha Plant (Indian Ginseng)",
    aliases: ["Ashwagandha", "Indian Ginseng", "Withania somnifera"],
  },
  {
    kannada: "ಶತಾವರಿ ಗಿಡ",
    english: "Shatavari Plant (Asparagus racemosus)",
    aliases: ["Shatavari", "Shathavari", "Asparagus racemosus"],
  },
  {
    kannada: "ಲೋಳೆಸರ ಗಿಡ",
    english: "Aloe Vera Plant (Lolesara)",
    aliases: ["Aloe Vera", "Aloevera", "Lolesara", "Lole Sara"],
  },
  {
    kannada: "ವೀಳ್ಯದೆಲೆ ಗಿಡ",
    english: "Betel Leaf Vine (Vilyadele)",
    aliases: ["Betel Leaf", "Vilyadele", "Veelyadele", "Paan Leaf"],
  },
  {
    kannada: "ನುಗ್ಗೆ ಗಿಡ",
    english: "Drumstick Plant (Nugge / Moringa PKM)",
    aliases: ["Drumstick", "Nugge", "Moringa", "Nuggekai"],
  },
  {
    kannada: "ಬೇವಿನ ಗಿಡ",
    english: "Neem Sapling (Bevu)",
    aliases: ["Neem", "Bevu", "Neem Tree", "Azadirachta indica"],
  },
  {
    kannada: "ಅಂಜೂರ ಗಿಡ",
    english: "Fig Plant (Anjura)",
    aliases: ["Fig", "Anjura", "Anjeer", "Fig Plant"],
  },
  {
    kannada: "ಡ್ರ್ಯಾಗನ್ ಫ್ರೂಟ್ ಗಿಡ",
    english: "Dragon Fruit Cutting / Plant",
    aliases: ["Dragon Fruit", "Dragonfruit", "Pitaya"],
  },
  {
    kannada: "ಪಾರಿಜಾತ ಗಿಡ",
    english: "Parijatha Plant (Night Flowering Jasmine)",
    aliases: ["Parijatha", "Parijat", "Night Flowering Jasmine"],
  },
  {
    kannada: "ಕನಕಾಂಬರ ಗಿಡ",
    english: "Kanakambara Plant (Crossandra)",
    aliases: ["Kanakambara", "Crossandra", "Firecracker Flower"],
  },
  {
    kannada: "ಸೇವಂತಿಗೆ ಗಿಡ",
    english: "Chrysanthemum (Sevanthige)",
    aliases: ["Chrysanthemum", "Sevanthige", "Shevanthi"],
  },
  {
    kannada: "ಚೆಂಡು ಹೂವು ಗಿಡ",
    english: "Marigold Plant (Chendu Hoovu)",
    aliases: ["Marigold", "Chendu Hoovu", "Genda"],
  },
  {
    kannada: "ಸುಗಂಧರಾಜ ಗಿಡ",
    english: "Tuberose (Sugandharaja)",
    aliases: ["Tuberose", "Sugandharaja", "Rajnigandha"],
  },
  {
    kannada: "ಸಿಲ್ವರ್ ಓಕ್ ಗಿಡ",
    english: "Silver Oak Sapling",
    aliases: ["Silver Oak", "Silver Oak Tree"],
  },
  {
    kannada: "ಬೀಟೆ / ರೋಸ್‌ವುಡ್ ಗಿಡ",
    english: "Rosewood Sapling (Beete)",
    aliases: ["Rosewood", "Beete", "Dalbergia latifolia"],
  },
  {
    kannada: "ಬಿದಿರು ಸಸಿ",
    english: "Bamboo Sapling (Bidiru / Giant Bamboo)",
    aliases: ["Bamboo", "Bidiru", "Giant Bamboo"],
  },

  // Nursery Supplies & Non-Plants
  {
    kannada: "ಎರೆಹುಳು ಗೊಬ್ಬರ (ವರ್ಮಿಕಂಪೋಸ್ಟ್)",
    english: "Vermicompost Organic Manure (50kg)",
    aliases: ["Vermicompost", "Organic Manure", "Compost", "Ere Hula Gobbera"],
  },
  {
    kannada: "ಕೊಕೊಪೀಟ್ ಬ್ಲಾಕ್",
    english: "Cocopeat Compressed Block (5kg)",
    aliases: ["Cocopeat", "Coco Peat", "Coir Pith", "Cocopeat Block"],
  },
  {
    kannada: "ಕೆಂಪು ನರ್ಸರಿ ಮಣ್ಣು",
    english: "Red Nursery Top Soil (Bag)",
    aliases: ["Red Soil", "Nursery Soil", "Potting Soil", "Mannu"],
  },
  {
    kannada: "ಪ್ಲಾಸ್ಟಿಕ್ ನರ್ಸರಿ ಪಾಟ್ 12 ಇಂಚು",
    english: "Plastic Nursery Pot 12 Inch",
    aliases: ["Plastic Pot", "Pot 12 Inch", "Planter", "Kundagalu"],
  },
  {
    kannada: "ಪ್ಲಾಸ್ಟಿಕ್ ನರ್ಸರಿ ಪಾಟ್ 8 ಇಂಚು",
    english: "Plastic Nursery Pot 8 Inch",
    aliases: ["Pot 8 Inch", "Flower Pot"],
  },
  {
    kannada: "ಸಸ್ಯ ಪೋಷಕಾಂಶ ದ್ರಾವಣ",
    english: "Bio-Fertilizer / Plant Tonic (1 Litre)",
    aliases: ["Bio Fertilizer", "Plant Tonic", "Panchagavya"],
  },
  {
    kannada: "ಗಾರ್ಡನ್ ಪ್ರೂನರ್ ಕತ್ತರಿ",
    english: "Garden Bypass Pruning Shears",
    aliases: ["Pruning Shears", "Pruner", "Kattari"],
  },
];

/**
 * Translates an item name intelligently between English and Kannada
 */
export function translateItemName(name: string, targetLang: Language): string {
  if (!name || typeof name !== "string") return name;
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  const lower = trimmed.toLowerCase();
  const cleanName = lower.replace(/\(.*?\)/g, "").trim();

  for (const item of PLANT_DICTIONARY) {
    const kanMatch =
      item.kannada === trimmed ||
      trimmed.includes(item.kannada) ||
      item.kannada.includes(trimmed);

    const engLower = item.english.toLowerCase();
    const cleanEng = engLower.replace(/\(.*?\)/g, "").trim();

    const engMatch =
      engLower === lower ||
      cleanEng === cleanName ||
      lower.includes(cleanEng) ||
      cleanEng.includes(lower) ||
      engLower.includes(lower) ||
      lower.startsWith(cleanEng);

    const aliasMatch = item.aliases?.some((a) => {
      const aLower = a.toLowerCase();
      return (
        aLower === lower ||
        lower.includes(aLower) ||
        aLower.includes(lower) ||
        cleanName.includes(aLower) ||
        lower.startsWith(aLower) ||
        aLower.startsWith(lower)
      );
    });

    if (kanMatch || engMatch || aliasMatch) {
      if (targetLang === "kn") {
        return item.kannada;
      } else {
        return item.english;
      }
    }
  }

  return trimmed;
}

/**
 * Converts numbers to authentic Indian Kannada currency words
 * Example: 1550 -> "ಒಂದು ಸಾವಿರದ ಐನೂರ ಐವತ್ತು ರೂಪಾಯಿ ಮಾತ್ರ"
 */
export function numberToKannadaWords(n: number): string {
  if (isNaN(n) || n <= 0) return "";

  const onesKn = [
    "",
    "ಒಂದು",
    "ಎರಡು",
    "ಮೂರು",
    "ನಾಲ್ಕು",
    "ಐದು",
    "ಆರು",
    "ಏಳು",
    "ಎಂಟು",
    "ಒಂಬತ್ತು",
    "ಹತ್ತು",
    "ಹನ್ನೊಂದು",
    "ಹನ್ನೆರಡು",
    "ಹದಿಮೂರು",
    "ಹದಿನಾಲ್ಕು",
    "ಹದಿನೈದು",
    "ಹದಿನಾರು",
    "ಹದಿನೇಳು",
    "ಹದಿನೆಂಟು",
    "ಹತ್ತೊಂಬತ್ತು",
  ];

  const tensPrefixKn = [
    "",
    "",
    "ಇಪ್ಪತ್ತ",
    "ಮೂವತ್ತ",
    "ನಲವತ್ತ",
    "ಐವತ್ತ",
    "ಅರವತ್ತ",
    "ಎಪ್ಪತ್ತ",
    "ಎಂಬತ್ತ",
    "ತೊಂಬತ್ತ",
  ];

  const tensExactKn = [
    "",
    "",
    "ಇಪ್ಪತ್ತು",
    "ಮೂವತ್ತು",
    "ನಲವತ್ತು",
    "ಐವತ್ತು",
    "ಅರವತ್ತು",
    "ಎಪ್ಪತ್ತು",
    "ಎಂಬತ್ತು",
    "ತೊಂಬತ್ತು",
  ];

  function convertUnder100(num: number): string {
    if (num <= 0) return "";
    if (num < 20) return onesKn[num];
    const t = Math.floor(num / 10);
    const r = num % 10;
    if (r === 0) return tensExactKn[t];
    return tensPrefixKn[t] + " " + onesKn[r];
  }

  function convertHundreds(num: number): string {
    const h = Math.floor(num / 100);
    const r = num % 100;
    if (h === 0) return convertUnder100(r);

    let hStr = "";
    if (r === 0) {
      switch (h) {
        case 1: hStr = "ಒಂದು ನೂರು"; break;
        case 2: hStr = "ಇನ್ನೂರು"; break;
        case 3: hStr = "ಮುನ್ನೂರು"; break;
        case 4: hStr = "ನಾನ್ನೂರು"; break;
        case 5: hStr = "ಐನೂರು"; break;
        case 6: hStr = "ಆರು ನೂರು"; break;
        case 7: hStr = "ಏಳು ನೂರು"; break;
        case 8: hStr = "ಎಂಟು ನೂರು"; break;
        case 9: hStr = "ಒಂಬೈನೂರು"; break;
        default: hStr = onesKn[h] + " ನೂರು";
      }
      return hStr;
    } else {
      switch (h) {
        case 1: hStr = "ಒಂದು ನೂರ"; break;
        case 2: hStr = "ಇನ್ನೂರ"; break;
        case 3: hStr = "ಮುನ್ನೂರ"; break;
        case 4: hStr = "ನಾನ್ನೂರ"; break;
        case 5: hStr = "ಐನೂರ"; break;
        case 6: hStr = "ಆರು ನೂರ"; break;
        case 7: hStr = "ಏಳು ನೂರ"; break;
        case 8: hStr = "ಎಂಟು ನೂರ"; break;
        case 9: hStr = "ಒಂಬೈನೂರ"; break;
        default: hStr = onesKn[h] + " ನೂರ";
      }
      return hStr + " " + convertUnder100(r);
    }
  }

  function convertFull(num: number): string {
    if (num === 0) return "";
    let parts: string[] = [];

    // Crore (1,00,00,000)
    if (num >= 10000000) {
      const cr = Math.floor(num / 10000000);
      parts.push(convertFull(cr) + " ಕೋಟಿ");
      num %= 10000000;
    }

    // Lakh (1,00,000)
    if (num >= 100000) {
      const lk = Math.floor(num / 100000);
      parts.push(convertFull(lk) + " ಲಕ್ಷ");
      num %= 100000;
    }

    // Thousand (1,000)
    if (num >= 1000) {
      const th = Math.floor(num / 1000);
      if (num % 1000 === 0) {
        parts.push(convertHundreds(th) + " ಸಾವಿರ");
      } else {
        parts.push(convertHundreds(th) + " ಸಾವಿರದ");
      }
      num %= 1000;
    }

    // Remaining < 1000
    if (num > 0) {
      parts.push(convertHundreds(num));
    }

    return parts.join(" ").trim();
  }

  const whole = Math.floor(n);
  const paise = Math.round((n - whole) * 100);

  let result = convertFull(whole) + " ರೂಪಾಯಿ";
  if (paise > 0) {
    result += " ಮತ್ತು " + convertUnder100(paise) + " ಪೈಸೆ";
  }
  return result + " ಮಾತ್ರ";
}

/**
 * Translates nursery stock category names to Kannada
 */
export function translateCategory(cat?: string | null, lang: Language = "kn"): string {
  if (!cat) return "";
  if (lang !== "kn") return cat;
  const c = cat.toLowerCase().trim();
  if (c === "plants" || c === "plant") return "ಗಿಡಗಳು";
  if (c === "non-plants" || c === "non-plant" || c === "nonplants") return "ಇತರ ವಸ್ತುಗಳು";
  return translateItemName(cat, "kn");
}

/**
 * Translates nursery stock subcategory names to Kannada
 */
export function translateSubcategory(sub?: string | null, lang: Language = "kn"): string {
  if (!sub) return "";
  if (lang !== "kn") return sub;
  const s = sub.toLowerCase().trim();
  switch (s) {
    case "fruit":
    case "fruit plants":
    case "fruits":
      return "ಹಣ್ಣಿನ ಗಿಡಗಳು";
    case "flower":
    case "flower plants":
    case "flowers":
      return "ಹೂವಿನ ಗಿಡಗಳು";
    case "ornamental":
    case "ornamental plants":
      return "ಅಲಂಕಾರಿಕ ಗಿಡಗಳು";
    case "medicinal":
    case "medicinal plants":
      return "ಔಷಧೀಯ ಗಿಡಗಳು";
    case "other":
    case "others":
    case "other plants":
      return "ಇತರ ಗಿಡಗಳು";
    case "pots":
    case "pots & planters":
    case "planters":
      return "ಕುಂಡಗಳು";
    case "fertilizers":
    case "fertilizers & manure":
    case "manure":
      return "ಗೊಬ್ಬರಗಳು";
    case "soil":
    case "soil & substrates":
    case "substrates":
      return "ಮಣ್ಣು ಮತ್ತು ಮಿಶ್ರಣ";
    case "tools":
    case "gardening tools":
      return "ತೋಟಗಾರಿಕೆ ಉಪಕರಣಗಳು";
    case "general":
    case "general supplies":
    case "supplies":
      return "ಸಾಮಾನ್ಯ ಸಾಮಗ್ರಿಗಳು";
    default:
      return translateItemName(sub, "kn");
  }
}

/**
 * Translates item measurement units to Kannada
 */
export function translateUnit(unit?: string | null, lang: Language = "kn"): string {
  if (!unit) return "";
  if (lang !== "kn") return unit;
  const u = unit.toLowerCase().trim();
  switch (u) {
    case "pcs":
    case "pc":
    case "piece":
    case "pieces":
    case "no":
    case "nos":
      return "ಸಂಖ್ಯೆ";
    case "kg":
    case "kgs":
    case "kilo":
    case "kilogram":
      return "ಕೆಜಿ";
    case "gm":
    case "gms":
    case "gram":
    case "grams":
      return "ಗ್ರಾಂ";
    case "bag":
    case "bags":
      return "ಚೀಲ";
    case "pot":
    case "pots":
      return "ಕುಂಡ";
    case "bunch":
    case "bunches":
      return "ಕಟ್ಟು";
    case "packet":
    case "packets":
    case "pkt":
    case "pkts":
      return "ಪ್ಯಾಕೆಟ್";
    case "box":
    case "boxes":
      return "ಪೆಟ್ಟಿಗೆ";
    case "sqft":
    case "sq.ft":
      return "ಚ.ಅಡಿ";
    default:
      return unit;
  }
}
