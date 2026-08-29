/**
 * Import Gujarati Names
 * Imports reviewed Gujarati translations from JSON file to database
 *
 * Run: node scripts/importGujaratiNames.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const {
  Commodity,
  Variety,
  Grade,
  State,
  District,
  Market,
} = require("../models");

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

// Get model by name
function getModel(modelName) {
  const models = {
    commodity: Commodity,
    variety: Variety,
    grade: Grade,
    state: State,
    district: District,
    market: Market,
  };
  return models[modelName.toLowerCase()];
}

// Import names for a specific model
async function importNames(modelName, records) {
  console.log(`\n📥 Importing ${modelName} translations...`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const Model = getModel(modelName);
  if (!Model) {
    console.log(`   ❌ Unknown model: ${modelName}`);
    return { updated, skipped, failed };
  }

  for (const record of records) {
    try {
      // Skip if no translation provided
      if (!record.name_gj || record.name_gj.trim() === "") {
        skipped++;
        continue;
      }

      // Update the record
      const result = await Model.findByIdAndUpdate(
        record.id,
        { name_gj: record.name_gj.trim() },
        { new: true },
      );

      if (result) {
        console.log(`   ✓ ${record.name} → ${record.name_gj}`);
        updated++;
      } else {
        console.log(`   ✗ Record not found: ${record.id} (${record.name})`);
        failed++;
      }
    } catch (error) {
      console.error(`   ✗ Error updating ${record.name}:`, error.message);
      failed++;
    }
  }

  console.log(
    `   Summary: ✅ ${updated} updated, ⏭️ ${skipped} skipped, ❌ ${failed} failed`,
  );
  return { updated, skipped, failed };
}

// Main execution
async function main() {
  console.log("\n📥 IMPORTING GUJARATI NAMES FROM JSON\n");

  // Get file path from command line argument or use default
  const fileName = process.argv[2] || "names_for_translation.json";
  const inputPath = path.join(__dirname, fileName);

  // Check if file exists
  if (!fs.existsSync(inputPath)) {
    console.error("❌ File not found: " + inputPath);
    console.log(
      "\n💡 Run this first: node scripts/extractNamesForTranslation.js",
    );
    process.exit(1);
  }

  // Read the JSON file
  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  console.log(`📄 Reading from: ${fileName}`);
  console.log(`📅 Extracted at: ${data.extractedAt}`);
  console.log(`📊 Total records: ${data.totalRecords}`);

  await connectDB();

  const results = {};

  // Import for each model
  for (const [modelName, records] of Object.entries(data.models)) {
    results[modelName] = await importNames(modelName, records);
  }

  // Overall summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 OVERALL SUMMARY");
  console.log("=".repeat(60));

  const totals = {
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  Object.entries(results).forEach(([model, stats]) => {
    console.log(
      `  ${model.padEnd(12)}: ✅ ${stats.updated} | ⏭️ ${stats.skipped} | ❌ ${stats.failed}`,
    );
    totals.updated += stats.updated;
    totals.skipped += stats.skipped;
    totals.failed += stats.failed;
  });

  console.log("\nTotal:");
  console.log(`  ✅ Updated: ${totals.updated}`);
  console.log(`  ⏭️ Skipped: ${totals.skipped}`);
  console.log(`  ❌ Failed: ${totals.failed}`);
  console.log("=".repeat(60));

  await mongoose.connection.close();
  console.log("\n✅ Database connection closed");
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Fatal Error:", error);
  process.exit(1);
});
