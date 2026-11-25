// scripts/verify-business-logic.ts
// Deterministic self-verifying test suite for nursery billing and math logic

import assert from "node:assert/strict";
import { formatMoney, numberToIndianWords } from "../src/lib/types";
import { numberToKannadaWords, translateUnit } from "../src/lib/plant-translations";
import { parseInvoiceNumber, formatInvoiceNumber, incrementInvoiceNumber } from "../src/lib/invoice-format";

console.log("Running business logic verification suite...");

// 1. Money formatting
assert.equal(formatMoney(0), "0.00", "Zero formatting failed");
assert.equal(formatMoney(1250), "1,250.00", "Thousands formatting failed");
assert.equal(formatMoney(150000), "1,50,000.00", "Indian numbering lakh formatting failed");
assert.equal(formatMoney(12345678.5), "1,23,45,678.50", "Crore formatting failed");
console.log("OK: Money formatting verified");

// 2. English words conversion
assert.equal(numberToIndianWords(0), "", "Zero should yield empty string");
assert.equal(numberToIndianWords(500), "Five Hundred Rupees Only", "500 words failed");
assert.equal(numberToIndianWords(1250.5), "One Thousand Two Hundred Fifty Rupees and Fifty Paise Only", "Paise words failed");
assert.equal(numberToIndianWords(100000), "One Lakh Rupees Only", "Lakh words failed");
console.log("OK: English currency words verified");

// 3. Kannada words conversion
assert.equal(numberToKannadaWords(0), "", "Kannada zero should yield empty string");
assert.equal(numberToKannadaWords(500), "ಐನೂರು ರೂಪಾಯಿ ಮಾತ್ರ", "Kannada 500 failed");
assert.equal(numberToKannadaWords(1000), "ಒಂದು ಸಾವಿರ ರೂಪಾಯಿ ಮಾತ್ರ", "Kannada 1000 failed");
assert.equal(numberToKannadaWords(100000), "ಒಂದು ಲಕ್ಷ ರೂಪಾಯಿ ಮಾತ್ರ", "Kannada 100000 failed");
assert.equal(numberToKannadaWords(1250.5), "ಒಂದು ಸಾವಿರದ ಇನ್ನೂರ ಐವತ್ತು ರೂಪಾಯಿ ಮತ್ತು ಐವತ್ತು ಪೈಸೆ ಮಾತ್ರ", "Kannada with paise failed");
console.log("OK: Kannada currency words verified");

// 4. Units translation
assert.equal(translateUnit("pcs", "kn"), "ಸಂಖ್ಯೆ", "Pieces translation failed");
assert.equal(translateUnit("pot", "kn"), "ಕುಂಡ", "Pot translation failed");
assert.equal(translateUnit("bag", "kn"), "ಚೀಲ", "Bag translation failed");
console.log("OK: Unit translations verified");

// 5. Invoice numbering format & sequence increment
const parsed1 = parseInvoiceNumber("INV-2026-0042");
assert.equal(parsed1.prefix, "INV-2026-", "Prefix parse failed");
assert.equal(parsed1.number, 42, "Number parse failed");
assert.equal(parsed1.padLength, 4, "Pad length failed");

assert.equal(incrementInvoiceNumber("INV-2026-0042"), "INV-2026-0043", "Increment failed");
assert.equal(incrementInvoiceNumber("INV-2026-0999"), "INV-2026-1000", "Rollover increment failed");
assert.equal(incrementInvoiceNumber("SVL-1"), "SVL-2", "Short prefix increment failed");
console.log("OK: Invoice sequence increment verified");

// 6. Stock aggregation logic verification
function aggregateRequestedItems(items: Array<{ stockItemId?: string | null; quantity?: number }>) {
  const map = new Map<string, number>();
  for (const li of items) {
    if (!li.stockItemId) continue;
    map.set(li.stockItemId, (map.get(li.stockItemId) || 0) + (li.quantity ?? 1));
  }
  return map;
}

const testItems = [
  { stockItemId: "item-1", quantity: 3 },
  { stockItemId: "item-2", quantity: 1 },
  { stockItemId: "item-1", quantity: 4 },
];
const agg = aggregateRequestedItems(testItems);
assert.equal(agg.get("item-1"), 7, "Duplicate item aggregation failed");
assert.equal(agg.get("item-2"), 1, "Single item aggregation failed");
console.log("OK: Stock aggregation logic verified");

console.log("All business logic verification tests passed successfully.");
