/**
 * Extract Names for Translation
 * Extracts all names from models that need Gujarati translation
 * Saves to JSON file for review and translation
 *
 * Run: node scripts/extractNamesForTranslation.js
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

// Extract names from a model
async function extractNames(Model, modelName) {
  console.log(`\n📋 Extracting ${modelName} names...`);

  const records = await Model.find({
    $or: [{ name_gj: { $exists: false } }, { name_gj: null }, { name_gj: "" }],
  }).select("_id name name_gj");

  console.log(
    `   Found ${records.length} ${modelName} records needing translation`,
  );

  return records.map((record) => ({
    id: record._id.toString(),
    name: record.name,
    name_gj: "", // Empty, to be filled
  }));
}

// Main execution
async function main() {
  console.log("\n📤 EXTRACTING NAMES FOR TRANSLATION\n");

  await connectDB();

  const data = {
    extractedAt: new Date().toISOString(),
    totalRecords: 0,
    models: {},
  };

  // Extract from each model
  data.models.commodity = await extractNames(Commodity, "Commodity");
  data.models.variety = await extractNames(Variety, "Variety");
  data.models.grade = await extractNames(Grade, "Grade");
  data.models.state = await extractNames(State, "State");
  data.models.district = await extractNames(District, "District");
  data.models.market = await extractNames(Market, "Market");

  // Calculate totals
  data.totalRecords =
    data.models.commodity.length +
    data.models.variety.length +
    data.models.grade.length +
    data.models.state.length +
    data.models.district.length +
    data.models.market.length;

  // Save to JSON file
  const outputPath = path.join(__dirname, "names_for_translation.json");
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");

  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`  Commodities: ${data.models.commodity.length}`);
  console.log(`  Varieties: ${data.models.variety.length}`);
  console.log(`  Grades: ${data.models.grade.length}`);
  console.log(`  States: ${data.models.state.length}`);
  console.log(`  Districts: ${data.models.district.length}`);
  console.log(`  Markets: ${data.models.market.length}`);
  console.log(`  Total: ${data.totalRecords}`);
  console.log("\n✅ Saved to: " + outputPath);
  console.log("\n💡 Next steps:");
  console.log("   1. Open names_for_translation.json");
  console.log("   2. Fill in the 'name_gj' fields with Gujarati translations");
  console.log("   3. Run: npm run import:gujarati");
  console.log("=".repeat(60));

  await mongoose.connection.close();
  console.log("\n✅ Database connection closed");
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Fatal Error:", error);
  process.exit(1);
});
