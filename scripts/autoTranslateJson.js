/**
 * Auto-translate all names in JSON file
 * Reads names_for_translation.json, translates all English names to Gujarati, updates the file
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  getCommodityGujaratiName,
  isInDictionary,
} = require("../utils/translate");

async function translateAllNames() {
  const inputPath = path.join(__dirname, "names_for_translation.json");

  console.log("\n🔤 AUTO-TRANSLATING ALL NAMES\n");
  console.log("📄 Reading: " + inputPath);

  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  let totalTranslated = 0;
  let fromDict = 0;
  let fromApi = 0;
  let failed = 0;

  // Translate each model
  for (const [modelName, records] of Object.entries(data.models)) {
    console.log(`\n📋 Translating ${modelName} (${records.length} records)...`);

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const progress = `[${i + 1}/${records.length}]`;

      try {
        const wasInDict = isInDictionary(record.name);
        const gujaratiName = await getCommodityGujaratiName(record.name);

        if (gujaratiName) {
          record.name_gj = gujaratiName;
          const source = wasInDict ? "📖" : "🌐";
          console.log(`${progress} ${source} ${record.name} → ${gujaratiName}`);
          totalTranslated++;

          if (wasInDict) {
            fromDict++;
          } else {
            fromApi++;
            // Delay for API calls to avoid rate limits
            await new Promise((resolve) => setTimeout(resolve, 2500));
          }
        } else {
          console.log(`${progress} ❌ Failed: ${record.name}`);
          failed++;
        }
      } catch (error) {
        if (error.message && error.message.includes("Too Many Requests")) {
          console.log(`\n⏸️  Rate limit hit at ${i + 1}/${records.length}`);
          console.log("💾 Saving progress so far...");
          break;
        }
        console.log(`${progress} ❌ Error: ${record.name} - ${error.message}`);
        failed++;
      }
    }
  }

  // Save the updated JSON
  data.translatedAt = new Date().toISOString();
  fs.writeFileSync(inputPath, JSON.stringify(data, null, 2), "utf-8");

  console.log("\n" + "=".repeat(60));
  console.log("📊 TRANSLATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Total Translated: ${totalTranslated}`);
  console.log(`📖 From Dictionary: ${fromDict} (instant)`);
  console.log(`🌐 From API: ${fromApi}`);
  console.log(`❌ Failed: ${failed}`);
  console.log("\n✅ Saved to: " + inputPath);
  console.log("=".repeat(60));

  if (failed > 0 || totalTranslated < data.totalRecords) {
    console.log(
      "\n💡 Some translations are missing. Run this script again to retry.",
    );
  } else {
    console.log(
      "\n🎉 All translations complete! Review the JSON file, then run:",
    );
    console.log("   node scripts/importGujaratiNames.js");
  }
}

translateAllNames().catch((error) => {
  console.error("\n❌ Fatal Error:", error);
  process.exit(1);
});
