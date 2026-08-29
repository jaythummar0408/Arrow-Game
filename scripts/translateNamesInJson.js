/**
 * Translate Names in JSON
 * Reads names_for_translation.json, translates all names to Gujarati, and saves back
 *
 * Run: node scripts/translateNamesInJson.js
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  getCommodityGujaratiName,
  isInDictionary,
} = require("../utils/translate");

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Main execution
async function main() {
  console.log("\n🔄 TRANSLATING NAMES TO GUJARATI\n");

  const inputPath = path.join(__dirname, "names_for_translation.json");
  const outputPath = path.join(__dirname, "names_for_translation.json");

  // Read the JSON file
  if (!fs.existsSync(inputPath)) {
    console.error("❌ File not found: " + inputPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  console.log(`📄 Reading from: ${inputPath}`);
  console.log(`📊 Total records: ${data.totalRecords}\n`);

  let totalTranslated = 0;
  let totalFromDict = 0;
  let totalFromApi = 0;
  let totalFailed = 0;

  // Process each model
  for (const [modelName, records] of Object.entries(data.models)) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(
      `Processing ${modelName.toUpperCase()} (${records.length} records)`,
    );
    console.log("=".repeat(60));

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const progress = `[${i + 1}/${records.length}]`;

      // Skip if already translated
      if (record.name_gj && record.name_gj.trim() !== "") {
        console.log(
          `${progress} ⏭️  Already translated: ${record.name} → ${record.name_gj}`,
        );
        continue;
      }

      try {
        const wasInDict = isInDictionary(record.name);
        const gujaratiName = await getCommodityGujaratiName(record.name);

        if (gujaratiName) {
          record.name_gj = gujaratiName;
          const source = wasInDict ? "📖" : "🌐";
          console.log(`${progress} ${source} ${record.name} → ${gujaratiName}`);
          totalTranslated++;

          if (wasInDict) {
            totalFromDict++;
          } else {
            totalFromApi++;
            // Add delay only for API calls
            await delay(3000); // 3 seconds delay to avoid rate limiting
          }
        } else {
          console.log(`${progress} ❌ Failed: ${record.name}`);
          totalFailed++;
        }
      } catch (error) {
        console.error(
          `${progress} ❌ Error translating "${record.name}":`,
          error.message,
        );
        totalFailed++;

        // If rate limit hit, save progress and exit
        if (error.message && error.message.includes("Too Many Requests")) {
          console.log(`\n⏸️  Rate limit hit. Saving progress...`);
          fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
          console.log(`✅ Progress saved to: ${outputPath}`);
          console.log(
            `💡 Wait 5-10 minutes and run the script again to continue\n`,
          );
          process.exit(0);
        }
      }
    }
  }

  // Save the updated JSON
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 TRANSLATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`  ✅ Total Translated: ${totalTranslated}`);
  console.log(`  📖 From Dictionary: ${totalFromDict} (instant)`);
  console.log(`  🌐 From API: ${totalFromApi} (with delay)`);
  console.log(`  ❌ Failed: ${totalFailed}`);
  console.log(`\n✅ Saved to: ${outputPath}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review the translations in ${path.basename(outputPath)}`);
  console.log(`   2. Make any manual corrections if needed`);
  console.log(`   3. Run: node scripts/importGujaratiNames.js`);
  console.log("=".repeat(60));
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Fatal Error:", error);
  process.exit(1);
});
