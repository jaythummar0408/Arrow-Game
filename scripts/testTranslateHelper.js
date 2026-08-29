/**
 * Translation Helper Usage Examples
 * Demonstrates how to use the translate helper utility
 */

const {
  translateText,
  translateBatch,
  getCommodityGujaratiName,
  addToDictionary,
  getDictionary,
  getCacheStats,
  translateWithFallback,
  isInDictionary,
  getFromDictionary,
} = require("../utils/translate");

// Example 1: Simple translation
async function example1_simpleTranslation() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 1: Simple Translation");
  console.log("=".repeat(60));

  const word = "groundnut";
  const translation = await translateText(word);
  console.log(`${word} → ${translation}`);
}

// Example 2: Get commodity Gujarati name (fast - uses dictionary)
async function example2_commodityTranslation() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 2: Commodity Translation (Dictionary)");
  console.log("=".repeat(60));

  const commodities = ["wheat", "rice", "cotton", "onion", "potato"];

  for (const commodity of commodities) {
    const gujarati = await getCommodityGujaratiName(commodity);
    console.log(`${commodity} → ${gujarati}`);
  }
}

// Example 3: Batch translation
async function example3_batchTranslation() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 3: Batch Translation");
  console.log("=".repeat(60));

  const words = ["carrot", "beetroot", "lettuce"];
  const results = await translateBatch(words, { delay: 300 });

  console.log("Batch Results:");
  Object.entries(results).forEach(([english, gujarati]) => {
    console.log(`  ${english} → ${gujarati}`);
  });
}

// Example 4: Check dictionary before API call
async function example4_checkDictionary() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 4: Check Dictionary First");
  console.log("=".repeat(60));

  const commodities = ["wheat", "apple", "unknown_commodity"];

  for (const commodity of commodities) {
    const inDict = isInDictionary(commodity);
    console.log(`${commodity} in dictionary: ${inDict}`);

    if (inDict) {
      const translation = getFromDictionary(commodity);
      console.log(`  → ${translation} (from dictionary - instant!)`);
    } else {
      const translation = await translateText(commodity);
      console.log(`  → ${translation} (from API - slower)`);
    }
  }
}

// Example 5: Add custom translation to dictionary
async function example5_addCustom() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 5: Add Custom Translation");
  console.log("=".repeat(60));

  // Add custom translation
  addToDictionary("dragon fruit", "ડ્રેગન ફ્રુટ");

  // Now it's available instantly
  const translation = getFromDictionary("dragon fruit");
  console.log(`dragon fruit → ${translation}`);
}

// Example 6: Translation with fallback
async function example6_withFallback() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 6: Translation with Fallback");
  console.log("=".repeat(60));

  // Even if translation fails, it returns the original text
  const result = await translateWithFallback("banana");
  console.log(`Translation result: ${result}`);
}

// Example 7: Cache statistics
async function example7_cacheStats() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 7: Cache Statistics");
  console.log("=".repeat(60));

  const stats = getCacheStats();
  console.log("Cache Statistics:");
  console.log(`  Cached translations: ${stats.cacheSize}`);
  console.log(`  Dictionary entries: ${stats.dictionarySize}`);
}

// Example 8: Get full dictionary
async function example8_getDictionary() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 8: Get Dictionary (First 10)");
  console.log("=".repeat(60));

  const dict = getDictionary();
  const entries = Object.entries(dict).slice(0, 10);

  console.log("Sample Dictionary Entries:");
  entries.forEach(([english, gujarati]) => {
    console.log(`  ${english} → ${gujarati}`);
  });
  console.log(`  ... and ${Object.keys(dict).length - 10} more`);
}

// Example 9: Translate to different language
async function example9_differentLanguage() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 9: Translate to Hindi");
  console.log("=".repeat(60));

  const word = "groundnut";
  const gujarati = await translateText(word, { targetLang: "gu" });
  const hindi = await translateText(word, { targetLang: "hi" });

  console.log(`${word}:`);
  console.log(`  Gujarati: ${gujarati}`);
  console.log(`  Hindi: ${hindi}`);
}

// Example 10: Real-world use case - API response
async function example10_apiResponse() {
  console.log("\n" + "=".repeat(60));
  console.log("Example 10: Real-world API Response");
  console.log("=".repeat(60));

  // Simulate commodity data from database
  const commodities = [
    { id: 1, name: "wheat", price: 2500 },
    { id: 2, name: "rice", price: 3000 },
    { id: 3, name: "cotton", price: 5500 },
  ];

  // Add Gujarati names
  const enrichedData = await Promise.all(
    commodities.map(async (commodity) => ({
      ...commodity,
      nameGujarati: await getCommodityGujaratiName(commodity.name),
    })),
  );

  console.log("Enriched API Response:");
  console.log(JSON.stringify(enrichedData, null, 2));
}

// Run all examples
async function runAllExamples() {
  console.log("\n🔤 TRANSLATION HELPER - USAGE EXAMPLES\n");

  try {
    await example1_simpleTranslation();
    await example2_commodityTranslation();
    await example3_batchTranslation();
    await example4_checkDictionary();
    await example5_addCustom();
    await example6_withFallback();
    await example7_cacheStats();
    await example8_getDictionary();
    await example9_differentLanguage();
    await example10_apiResponse();

    console.log("\n" + "=".repeat(60));
    console.log("✅ All examples completed successfully!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

// Run examples
if (require.main === module) {
  runAllExamples();
}

module.exports = { runAllExamples };
