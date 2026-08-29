/**
 * Translation Testing Script
 * Test English to Gujarati translation for commodity names
 *
 * Free translation options tested:
 * 1. @vitalets/google-translate-api - Free Google Translate API
 * 2. google-translate-api-x - Updated fork with better reliability
 * 3. @iamtraction/google-translate - Alternative implementation
 *
 * To install any of these, run:
 * npm install @vitalets/google-translate-api
 * OR
 * npm install google-translate-api-x
 * OR
 * npm install @iamtraction/google-translate
 */

// Uncomment the package you want to test:
// const translate = require('@vitalets/google-translate-api');
// const translate = require('google-translate-api-x');
// const { translate } = require('@iamtraction/google-translate');

/**
 * Method 1: Using @vitalets/google-translate-api
 */
async function translateWithVitalets(word, targetLang = "gu") {
  try {
    const { translate } = require("@vitalets/google-translate-api");
    const res = await translate(word, { to: targetLang });
    console.log(`\n✅ @vitalets/google-translate-api:`);
    console.log(`   English: ${word}`);
    console.log(`   Gujarati: ${res.text}`);
    return res.text;
  } catch (error) {
    console.log(`\n❌ @vitalets/google-translate-api failed:`);
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Method 2: Using google-translate-api-x (More reliable fork)
 */
async function translateWithApiX(word, targetLang = "gu") {
  try {
    const translate = require("google-translate-api-x");
    const res = await translate(word, { to: targetLang });
    console.log(`\n✅ google-translate-api-x:`);
    console.log(`   English: ${word}`);
    console.log(`   Gujarati: ${res.text}`);
    return res.text;
  } catch (error) {
    console.log(`\n❌ google-translate-api-x failed:`);
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Method 3: Using @iamtraction/google-translate
 */
async function translateWithIamtraction(word, targetLang = "gu") {
  try {
    const { translate } = require("@iamtraction/google-translate");
    const res = await translate(word, { to: targetLang });
    console.log(`\n✅ @iamtraction/google-translate:`);
    console.log(`   English: ${word}`);
    console.log(`   Gujarati: ${res.text}`);
    return res.text;
  } catch (error) {
    console.log(`\n❌ @iamtraction/google-translate failed:`);
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Test all available translation methods
 */
async function testAllMethods(word) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing Translation for: "${word}"`);
  console.log(`${"=".repeat(60)}`);

  const results = {
    word: word,
    translations: {},
  };

  // Try Method 1
  const result1 = await translateWithVitalets(word);
  if (result1) results.translations["vitalets"] = result1;

  // Try Method 2
  const result2 = await translateWithApiX(word);
  if (result2) results.translations["apiX"] = result2;

  // Try Method 3
  const result3 = await translateWithIamtraction(word);
  if (result3) results.translations["iamtraction"] = result3;

  return results;
}

/**
 * Test batch translation for common commodities
 */
async function testBatchTranslation() {
  const commodities = [
    "groundnut",
    "wheat",
    "rice",
    "cotton",
    "onion",
    "potato",
    "tomato",
    "garlic",
    "turmeric",
    "coriander",
  ];

  console.log(`\n${"=".repeat(60)}`);
  console.log(`BATCH TRANSLATION TEST`);
  console.log(`${"=".repeat(60)}`);

  const allResults = [];

  for (const commodity of commodities) {
    const result = await testAllMethods(commodity);
    allResults.push(result);

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`TRANSLATION SUMMARY`);
  console.log(`${"=".repeat(60)}`);

  allResults.forEach((result) => {
    console.log(`\n${result.word}:`);
    Object.entries(result.translations).forEach(([method, translation]) => {
      console.log(`  ${method}: ${translation}`);
    });
  });

  return allResults;
}

/**
 * Test single word translation
 */
async function testSingleWord(word = "groundnut") {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`SINGLE WORD TRANSLATION TEST`);
  console.log(`${"=".repeat(60)}`);

  await testAllMethods(word);
}

/**
 * Create translation dictionary for common commodities
 */
async function createCommodityDictionary() {
  const commodities = [
    "groundnut",
    "wheat",
    "rice",
    "cotton",
    "onion",
    "potato",
    "tomato",
    "garlic",
    "turmeric",
    "coriander",
    "cumin",
    "chickpea",
    "soybean",
    "mustard",
    "sesame",
    "castor",
    "bajra",
    "jowar",
    "maize",
    "banana",
    "mango",
    "papaya",
  ];

  console.log(`\n${"=".repeat(60)}`);
  console.log(`CREATING COMMODITY TRANSLATION DICTIONARY`);
  console.log(`${"=".repeat(60)}`);

  const dictionary = {};

  // Try to use the first available translation library
  for (const commodity of commodities) {
    try {
      // Try method 1 first
      const { translate } = require("@vitalets/google-translate-api");
      const res = await translate(commodity, { to: "gu" });
      dictionary[commodity] = res.text;
      console.log(`✓ ${commodity} → ${res.text}`);

      // Delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`✗ ${commodity} - Error: ${error.message}`);
    }
  }

  console.log(`\n\nDictionary JSON:`);
  console.log(JSON.stringify(dictionary, null, 2));

  return dictionary;
}

// Main execution
const args = process.argv.slice(2);
const command = args[0] || "single";
const word = args[1] || "groundnut";

(async () => {
  console.log(`\n🔤 TRANSLATION TESTING FOR COMMODITY NAMES`);
  console.log(`English → Gujarati (gu)`);

  try {
    switch (command) {
      case "single":
        await testSingleWord(word);
        break;
      case "batch":
        await testBatchTranslation();
        break;
      case "dictionary":
        await createCommodityDictionary();
        break;
      case "all":
        await testAllMethods(word);
        break;
      default:
        console.log(`\nUsage:`);
        console.log(
          `  node testTranslation.js single [word]      - Test single word`,
        );
        console.log(
          `  node testTranslation.js batch              - Test batch of commodities`,
        );
        console.log(
          `  node testTranslation.js dictionary         - Create translation dictionary`,
        );
        console.log(
          `  node testTranslation.js all [word]         - Try all translation methods`,
        );
    }
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    console.log(`\n💡 Make sure to install one of these packages first:`);
    console.log(`   npm install @vitalets/google-translate-api`);
    console.log(`   npm install google-translate-api-x`);
    console.log(`   npm install @iamtraction/google-translate`);
  }
})();

module.exports = {
  translateWithVitalets,
  translateWithApiX,
  translateWithIamtraction,
  testAllMethods,
  testBatchTranslation,
  createCommodityDictionary,
};
