/**
 * Update Gujarati Names Script
 * Updates all existing records in models with name field to add name_gj (Gujarati name)
 *
 * Run: node scripts/updateGujaratiNames.js [options]
 *
 * Options:
 *   --batch=N          Process N records at a time (default: 50)
 *   --delay=N          Delay between translations in ms (default: 2000)
 *   --models=model1,model2  Process only specific models (comma-separated)
 *                      Available: commodity,variety,grade,state,district,market
 *
 * Examples:
 *   node scripts/updateGujaratiNames.js --batch=20 --delay=3000
 *   node scripts/updateGujaratiNames.js --models=commodity,variety
 */

require("dotenv").config();
const mongoose = require("mongoose");
const {
  Commodity,
  State,
  District,
  Market,
  Variety,
  Grade,
} = require("../models");
const {
  getCommodityGujaratiName,
  isInDictionary,
} = require("../utils/translate");

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  batchSize: 50,
  delay: 2000,
  models: ["commodity", "variety", "grade", "state", "district", "market"],
};

args.forEach((arg) => {
  if (arg.startsWith("--batch=")) {
    config.batchSize = parseInt(arg.split("=")[1]);
  } else if (arg.startsWith("--delay=")) {
    config.delay = parseInt(arg.split("=")[1]);
  } else if (arg.startsWith("--models=")) {
    config.models = arg
      .split("=")[1]
      .split(",")
      .map((m) => m.trim().toLowerCase());
  }
});

console.log("\n⚙️  Configuration:");
console.log(`  Batch Size: ${config.batchSize} records`);
console.log(`  Delay: ${config.delay}ms between translations`);
console.log(`  Models: ${config.models.join(", ")}`);

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
}

// Update Gujarati names for a specific model
async function updateModelGujaratiNames(
  Model,
  modelName,
  shouldTranslate = true,
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Updating ${modelName} records...`);
  console.log("=".repeat(60));

  try {
    // Get all records without name_gj or with empty name_gj
    const records = await Model.find({
      $or: [
        { name_gj: { $exists: false } },
        { name_gj: null },
        { name_gj: "" },
      ],
    });

    console.log(`Found ${records.length} ${modelName} records to update`);

    if (records.length === 0) {
      console.log(`✅ All ${modelName} records already have Gujarati names`);
      return {
        updated: 0,
        failed: 0,
        skipped: 0,
        inDictionary: 0,
        apiCalls: 0,
      };
    }

    // If translation should be skipped (for proper nouns)
    if (!shouldTranslate) {
      console.log(`⚠️  ${modelName} are proper nouns - skipping translation`);
      return {
        updated: 0,
        failed: 0,
        skipped: records.length,
        inDictionary: 0,
        apiCalls: 0,
      };
    }

    // Count how many are in dictionary vs need API calls
    const inDictCount = records.filter((r) => isInDictionary(r.name)).length;
    const needApiCount = records.length - inDictCount;
    console.log(`📖 In dictionary: ${inDictCount} (instant)`);
    console.log(`🌐 Need API calls: ${needApiCount}`);

    let updated = 0;
    let failed = 0;
    let skipped = 0;
    let inDictionary = 0;
    let apiCalls = 0;
    let processedInBatch = 0;

    // Process in batches
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const progress = `[${i + 1}/${records.length}]`;

      try {
        const wasInDict = isInDictionary(record.name);
        const gujaratiName = await getCommodityGujaratiName(record.name);

        if (gujaratiName) {
          record.name_gj = gujaratiName;
          await record.save();

          const source = wasInDict ? "📖" : "🌐";
          console.log(`${progress} ${source} ${record.name} → ${gujaratiName}`);
          updated++;

          if (wasInDict) {
            inDictionary++;
          } else {
            apiCalls++;
          }
        } else {
          console.log(`${progress} ✗ Failed to translate: ${record.name}`);
          failed++;
        }

        processedInBatch++;

        // Add delay only for API calls (not for dictionary lookups)
        if (!wasInDict && config.delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, config.delay));
        }

        // Progress update every batch
        if (processedInBatch >= config.batchSize) {
          console.log(
            `\n⏸️  Batch complete. Progress: ${i + 1}/${records.length}`,
          );
          console.log(
            `   ✅ ${updated} updated | ❌ ${failed} failed | 📖 ${inDictionary} from dict | 🌐 ${apiCalls} API calls\n`,
          );
          processedInBatch = 0;
        }
      } catch (error) {
        if (error.message && error.message.includes("Too Many Requests")) {
          console.log(
            `\n⏸️  Rate limit hit after ${i + 1}/${records.length} records`,
          );
          console.log(`   Progress saved: ${updated} updated successfully`);
          console.log(
            `   💡 Wait 5-10 minutes and run the script again to continue`,
          );
          console.log(`   The script will resume from where it stopped\n`);
          break;
        }
        console.error(
          `${progress} ✗ Error updating ${record.name}:`,
          error.message,
        );
        failed++;
      }
    }

    console.log(`\n${modelName} Summary:`);
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📖 From Dictionary: ${inDictionary}`);
    console.log(`  🌐 API Calls Made: ${apiCalls}`);
    console.log(`  Total Processed: ${updated + failed}/${records.length}`);

    return { updated, failed, skipped, inDictionary, apiCalls };
  } catch (error) {
    console.error(`Error updating ${modelName}:`, error.message);
    return { updated: 0, failed: 0, skipped: 0, inDictionary: 0, apiCalls: 0 };
  }
}

// Main execution
async function main() {
  console.log("\n🔤 UPDATING GUJARATI NAMES FOR ALL RECORDS\n");

  await connectDB();

  const startTime = Date.now();
  const results = {
    commodity: {
      updated: 0,
      failed: 0,
      skipped: 0,
      inDictionary: 0,
      apiCalls: 0,
    },
    state: { updated: 0, failed: 0, skipped: 0, inDictionary: 0, apiCalls: 0 },
    district: {
      updated: 0,
      failed: 0,
      skipped: 0,
      inDictionary: 0,
      apiCalls: 0,
    },
    market: { updated: 0, failed: 0, skipped: 0, inDictionary: 0, apiCalls: 0 },
    variety: {
      updated: 0,
      failed: 0,
      skipped: 0,
      inDictionary: 0,
      apiCalls: 0,
    },
    grade: { updated: 0, failed: 0, skipped: 0, inDictionary: 0, apiCalls: 0 },
  };

  // Update each model based on configuration
  // Only translate Commodities, Varieties, and Grades (not proper nouns)
  if (config.models.includes("commodity")) {
    results.commodity = await updateModelGujaratiNames(
      Commodity,
      "Commodity",
      true,
    );
  }
  if (config.models.includes("variety")) {
    results.variety = await updateModelGujaratiNames(Variety, "Variety", true);
  }
  if (config.models.includes("grade")) {
    results.grade = await updateModelGujaratiNames(Grade, "Grade", true);
  }

  // Skip translation for proper nouns (States, Districts, Markets)
  if (config.models.includes("state")) {
    results.state = await updateModelGujaratiNames(State, "State", false);
  }
  if (config.models.includes("district")) {
    results.district = await updateModelGujaratiNames(
      District,
      "District",
      false,
    );
  }
  if (config.models.includes("market")) {
    results.market = await updateModelGujaratiNames(Market, "Market", false);
  }

  // Overall summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${"=".repeat(60)}`);
  console.log("OVERALL SUMMARY");
  console.log("=".repeat(60));

  const totalUpdated = Object.values(results).reduce(
    (sum, r) => sum + r.updated,
    0,
  );
  const totalFailed = Object.values(results).reduce(
    (sum, r) => sum + r.failed,
    0,
  );
  const totalDict = Object.values(results).reduce(
    (sum, r) => sum + r.inDictionary,
    0,
  );
  const totalApi = Object.values(results).reduce(
    (sum, r) => sum + r.apiCalls,
    0,
  );

  console.log("\nBy Model:");
  Object.entries(results).forEach(([model, stats]) => {
    if (stats.updated > 0 || stats.failed > 0 || stats.skipped > 0) {
      console.log(
        `  ${model.padEnd(12)}: ✅ ${stats.updated} updated, ❌ ${stats.failed} failed, 📖 ${stats.inDictionary} dict, 🌐 ${stats.apiCalls} API`,
      );
    }
  });

  console.log(`\nTotal:`);
  console.log(`  ✅ Total Updated: ${totalUpdated}`);
  console.log(`  ❌ Total Failed: ${totalFailed}`);
  console.log(`  📖 From Dictionary: ${totalDict} (instant)`);
  console.log(`  🌐 API Calls: ${totalApi}`);
  console.log(`  ⏱️  Time Taken: ${duration}s`);

  if (totalApi > 0) {
    const avgTimePerApi = ((duration * 1000) / totalApi).toFixed(0);
    console.log(`  📊 Average time per API call: ${avgTimePerApi}ms`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ Update process completed!");
  console.log("=".repeat(60));

  if (
    totalFailed > 0 ||
    totalApi < Object.values(results).reduce((sum, r) => sum + r.skipped, 0)
  ) {
    console.log(
      `\n💡 Tip: If you hit rate limits, wait 5-10 minutes and run again.`,
    );
    console.log(`   The script will only process remaining records.\n`);
  }

  await mongoose.connection.close();
  console.log("\n✅ Database connection closed");
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Fatal Error:", error);
  process.exit(1);
});
