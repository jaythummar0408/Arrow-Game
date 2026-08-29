/**
 * Simple Translation Example
 * Quick test for English to Gujarati translation
 *
 * Install first: npm install @vitalets/google-translate-api
 * Run: node scripts/simpleTranslate.js
 */

const { translate } = require("@vitalets/google-translate-api");
    console.error(`Error translating "${word}":`, error.message);
    console.log("\n💡 Make sure to install the package first:");
    console.log("   npm install @vitalets/google-translate-api");
    return null;
  }
}

// Test with multiple words
async function testMultiple() {
  const words = ["groundnut", "wheat", "rice", "cotton", "onion"];

  console.log("\n🌾 Translating Commodity Names to Gujarati\n");
  console.log("=".repeat(50));

  for (const word of words) {
    await translateWord(word);
    console.log("-".repeat(50));

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// Run the test
testMultiple();
