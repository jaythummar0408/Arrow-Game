require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Import models
const Commodity = require("../models/commodity.model");
const Variety = require("../models/variety.model");
const Grade = require("../models/grade.model");

// Database configuration
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/APMC";

async function updateGujaratiNames() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to MongoDB successfully\n");

    // Read the translation JSON file
    const jsonPath = path.join(__dirname, "names_for_translation.json");
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    console.log(`Total records to process: ${jsonData.totalRecords}`);
    console.log(`Data extracted at: ${jsonData.extractedAt}\n`);

    // Statistics
    const stats = {
      commodity: { total: 0, updated: 0, skipped: 0, errors: 0 },
      variety: { total: 0, updated: 0, skipped: 0, errors: 0 },
      grade: { total: 0, updated: 0, skipped: 0, errors: 0 },
    };

    // Update Commodities
    console.log("=== Updating Commodities ===");
    if (jsonData.models.commodity && jsonData.models.commodity.length > 0) {
      stats.commodity.total = jsonData.models.commodity.length;

      for (const item of jsonData.models.commodity) {
        try {
          if (!item.name_gj) {
            console.log(`⚠ Skipping commodity ID ${item.id}: No Gujarati name`);
            stats.commodity.skipped++;
            continue;
          }

          const result = await Commodity.findByIdAndUpdate(
            item.id,
            { $set: { name_gj: item.name_gj } },
            { new: true },
          );

          if (result) {
            console.log(`✓ Updated: ${result.name} → ${item.name_gj}`);
            stats.commodity.updated++;
          } else {
            console.log(`✗ Not found: ID ${item.id} (${item.name})`);
            stats.commodity.errors++;
          }
        } catch (error) {
          console.error(
            `✗ Error updating commodity ID ${item.id}:`,
            error.message,
          );
          stats.commodity.errors++;
        }
      }
    }
    console.log();

    // Update Varieties
    console.log("=== Updating Varieties ===");
    if (jsonData.models.variety && jsonData.models.variety.length > 0) {
      stats.variety.total = jsonData.models.variety.length;

      for (const item of jsonData.models.variety) {
        try {
          if (!item.name_gj) {
            console.log(`⚠ Skipping variety ID ${item.id}: No Gujarati name`);
            stats.variety.skipped++;
            continue;
          }

          const result = await Variety.findByIdAndUpdate(
            item.id,
            { $set: { name_gj: item.name_gj } },
            { new: true },
          );

          if (result) {
            console.log(`✓ Updated: ${result.name} → ${item.name_gj}`);
            stats.variety.updated++;
          } else {
            console.log(`✗ Not found: ID ${item.id} (${item.name})`);
            stats.variety.errors++;
          }
        } catch (error) {
          console.error(
            `✗ Error updating variety ID ${item.id}:`,
            error.message,
          );
          stats.variety.errors++;
        }
      }
    }
    console.log();

    // Update Grades
    console.log("=== Updating Grades ===");
    if (jsonData.models.grade && jsonData.models.grade.length > 0) {
      stats.grade.total = jsonData.models.grade.length;

      for (const item of jsonData.models.grade) {
        try {
          if (!item.name_gj) {
            console.log(`⚠ Skipping grade ID ${item.id}: No Gujarati name`);
            stats.grade.skipped++;
            continue;
          }

          const result = await Grade.findByIdAndUpdate(
            item.id,
            { $set: { name_gj: item.name_gj } },
            { new: true },
          );

          if (result) {
            console.log(`✓ Updated: ${result.name} → ${item.name_gj}`);
            stats.grade.updated++;
          } else {
            console.log(`✗ Not found: ID ${item.id} (${item.name})`);
            stats.grade.errors++;
          }
        } catch (error) {
          console.error(`✗ Error updating grade ID ${item.id}:`, error.message);
          stats.grade.errors++;
        }
      }
    }
    console.log();

    // Print Summary
    console.log("╔════════════════════════════════════════╗");
    console.log("║         UPDATE SUMMARY                 ║");
    console.log("╚════════════════════════════════════════╝");
    console.log();

    console.log("COMMODITIES:");
    console.log(`  Total: ${stats.commodity.total}`);
    console.log(`  ✓ Updated: ${stats.commodity.updated}`);
    console.log(`  ⚠ Skipped: ${stats.commodity.skipped}`);
    console.log(`  ✗ Errors: ${stats.commodity.errors}`);
    console.log();

    console.log("VARIETIES:");
    console.log(`  Total: ${stats.variety.total}`);
    console.log(`  ✓ Updated: ${stats.variety.updated}`);
    console.log(`  ⚠ Skipped: ${stats.variety.skipped}`);
    console.log(`  ✗ Errors: ${stats.variety.errors}`);
    console.log();

    console.log("GRADES:");
    console.log(`  Total: ${stats.grade.total}`);
    console.log(`  ✓ Updated: ${stats.grade.updated}`);
    console.log(`  ⚠ Skipped: ${stats.grade.skipped}`);
    console.log(`  ✗ Errors: ${stats.grade.errors}`);
    console.log();

    const totalUpdated =
      stats.commodity.updated + stats.variety.updated + stats.grade.updated;
    const totalRecords =
      stats.commodity.total + stats.variety.total + stats.grade.total;
    console.log(
      `OVERALL: ${totalUpdated}/${totalRecords} records updated successfully`,
    );
    console.log();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
  }
}

// Run the update script
console.log("╔═══════════════════════════════════════════════╗");
console.log("║  Gujarati Names Database Update Script       ║");
console.log("╚═══════════════════════════════════════════════╝");
console.log();

updateGujaratiNames()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
