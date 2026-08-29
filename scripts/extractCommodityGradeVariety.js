require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");

// Import database connection
const connectDB = require("../config/database");

// Import models
const Commodity = require("../models/commodity.model");
const Variety = require("../models/variety.model");
const Grade = require("../models/grade.model");

async function extractData() {
  try {
    // Connect to database
    await connectDB();
    console.log("\n🔍 Extracting Commodity, Variety, and Grade data...\n");

    // Fetch all data
    const commodities = await Commodity.find({}).lean();
    const varieties = await Variety.find({}).lean();
    const grades = await Grade.find({}).lean();

    console.log(`📊 Found:`);
    console.log(`   Commodities: ${commodities.length}`);
    console.log(`   Varieties: ${varieties.length}`);
    console.log(`   Grades: ${grades.length}\n`);

    // Show sample data
    console.log("📝 Sample Commodity:");
    if (commodities.length > 0) {
      const sample = commodities[0];
      console.log(`   ID: ${sample._id}`);
      console.log(`   Name: ${sample.name}`);
      console.log(`   Name GJ: ${sample.name_gj || "(empty)"}`);
    }

    console.log("\n📝 Sample Variety:");
    if (varieties.length > 0) {
      const sample = varieties[0];
      console.log(`   ID: ${sample._id}`);
      console.log(`   Name: ${sample.name}`);
      console.log(`   Name GJ: ${sample.name_gj || "(empty)"}`);
    }

    console.log("\n📝 Sample Grade:");
    if (grades.length > 0) {
      const sample = grades[0];
      console.log(`   ID: ${sample._id}`);
      console.log(`   Name: ${sample.name}`);
      console.log(`   Name GJ: ${sample.name_gj || "(empty)"}`);
    }

    // Count how many have name_gj
    const commodityWithGj = commodities.filter(
      (c) => c.name_gj && c.name_gj.trim() !== "",
    ).length;
    const varietyWithGj = varieties.filter(
      (v) => v.name_gj && v.name_gj.trim() !== "",
    ).length;
    const gradeWithGj = grades.filter(
      (g) => g.name_gj && g.name_gj.trim() !== "",
    ).length;

    console.log("\n📈 Gujarati Names Count:");
    console.log(
      `   Commodities with name_gj: ${commodityWithGj}/${commodities.length}`,
    );
    console.log(
      `   Varieties with name_gj: ${varietyWithGj}/${varieties.length}`,
    );
    console.log(`   Grades with name_gj: ${gradeWithGj}/${grades.length}`);

    // Create export data structure
    const exportData = {
      extractedAt: new Date().toISOString(),
      totalRecords: commodities.length + varieties.length + grades.length,
      models: {
        commodity: commodities.map((c) => ({
          id: c._id.toString(),
          name: c.name,
          name_gj: c.name_gj || "",
        })),
        variety: varieties.map((v) => ({
          id: v._id.toString(),
          name: v.name,
          name_gj: v.name_gj || "",
        })),
        grade: grades.map((g) => ({
          id: g._id.toString(),
          name: g.name,
          name_gj: g.name_gj || "",
        })),
      },
    };

    // Save to file
    const outputPath = path.join(
      __dirname,
      "commodity_variety_grade_data.json",
    );
    await fs.writeFile(
      outputPath,
      JSON.stringify(exportData, null, 2),
      "utf-8",
    );

    console.log(`\n✅ Data exported to: ${path.basename(outputPath)}`);
    console.log(`📁 Location: ${outputPath}\n`);
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed\n");
  }
}

// Run the extraction
if (require.main === module) {
  extractData()
    .then(() => {
      console.log("✨ Extraction completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Extraction failed:", error);
      process.exit(1);
    });
}

module.exports = extractData;
