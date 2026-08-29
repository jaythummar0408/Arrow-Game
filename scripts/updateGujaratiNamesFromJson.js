require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");

// Import database connection
const connectDB = require("../config/database");

// Import models
const State = require("../models/state.model");
const District = require("../models/district.model");
const Market = require("../models/market.model");

async function updateGujaratiNames() {
  try {
    // Connect to database first
    await connectDB();
    console.log("\n🚀 Starting Gujarati names update from JSON file...\n");

    // Read the JSON file
    const jsonFilePath = path.join(__dirname, "states_districts_markets.json");
    const jsonData = await fs.readFile(jsonFilePath, "utf8");
    const data = JSON.parse(jsonData);

    console.log(`📄 Loaded JSON file with ${data.totalRecords} records`);
    console.log(`   States: ${data.models.state?.length || 0}`);
    console.log(`   Districts: ${data.models.district?.length || 0}`);
    console.log(`   Markets: ${data.models.market?.length || 0}\n`);

    let stateUpdated = 0;
    let stateSkipped = 0;
    let districtUpdated = 0;
    let districtSkipped = 0;
    let marketUpdated = 0;
    let marketSkipped = 0;

    // Update States
    console.log("📍 Updating States...");
    if (data.models.state && data.models.state.length > 0) {
      for (const stateData of data.models.state) {
        try {
          const result = await State.updateOne(
            { _id: new mongoose.Types.ObjectId(stateData.id) },
            { $set: { name_gj: stateData.name_gj } },
          );

          if (result.modifiedCount > 0) {
            console.log(
              `   ✅ Updated: ${stateData.name} → ${stateData.name_gj}`,
            );
            stateUpdated++;
          } else if (result.matchedCount > 0) {
            console.log(
              `   ⏭️  Skipped: ${stateData.name} (already has same value)`,
            );
            stateSkipped++;
          } else {
            console.log(
              `   ⚠️  Not found: ${stateData.name} (ID: ${stateData.id})`,
            );
          }
        } catch (error) {
          console.error(
            `   ❌ Error updating state ${stateData.name}:`,
            error.message,
          );
        }
      }
    }
    console.log(
      `   📊 States - Updated: ${stateUpdated}, Skipped: ${stateSkipped}\n`,
    );

    // Update Districts
    console.log("🏘️  Updating Districts...");
    if (data.models.district && data.models.district.length > 0) {
      for (const districtData of data.models.district) {
        try {
          const result = await District.updateOne(
            { _id: new mongoose.Types.ObjectId(districtData.id) },
            { $set: { name_gj: districtData.name_gj } },
          );

          if (result.modifiedCount > 0) {
            console.log(
              `   ✅ Updated: ${districtData.name} → ${districtData.name_gj}`,
            );
            districtUpdated++;
          } else if (result.matchedCount > 0) {
            console.log(
              `   ⏭️  Skipped: ${districtData.name} (already has same value)`,
            );
            districtSkipped++;
          } else {
            console.log(
              `   ⚠️  Not found: ${districtData.name} (ID: ${districtData.id})`,
            );
          }
        } catch (error) {
          console.error(
            `   ❌ Error updating district ${districtData.name}:`,
            error.message,
          );
        }
      }
    }
    console.log(
      `   📊 Districts - Updated: ${districtUpdated}, Skipped: ${districtSkipped}\n`,
    );

    // Update Markets
    console.log("🏪 Updating Markets...");
    if (data.models.market && data.models.market.length > 0) {
      for (const marketData of data.models.market) {
        try {
          const result = await Market.updateOne(
            { _id: new mongoose.Types.ObjectId(marketData.id) },
            { $set: { name_gj: marketData.name_gj } },
          );

          if (result.modifiedCount > 0) {
            console.log(
              `   ✅ Updated: ${marketData.name} → ${marketData.name_gj}`,
            );
            marketUpdated++;
          } else if (result.matchedCount > 0) {
            console.log(
              `   ⏭️  Skipped: ${marketData.name} (already has same value)`,
            );
            marketSkipped++;
          } else {
            console.log(
              `   ⚠️  Not found: ${marketData.name} (ID: ${marketData.id})`,
            );
          }
        } catch (error) {
          console.error(
            `   ❌ Error updating market ${marketData.name}:`,
            error.message,
          );
        }
      }
    }
    console.log(
      `   📊 Markets - Updated: ${marketUpdated}, Skipped: ${marketSkipped}\n`,
    );

    // Summary
    console.log("═══════════════════════════════════════");
    console.log("✨ UPDATE SUMMARY");
    console.log("═══════════════════════════════════════");
    console.log(
      `📍 States:    ${stateUpdated} updated, ${stateSkipped} skipped`,
    );
    console.log(
      `🏘️  Districts: ${districtUpdated} updated, ${districtSkipped} skipped`,
    );
    console.log(
      `🏪 Markets:   ${marketUpdated} updated, ${marketSkipped} skipped`,
    );
    console.log("═══════════════════════════════════════");
    console.log(
      `📝 Total:     ${stateUpdated + districtUpdated + marketUpdated} updated`,
    );
    console.log("═══════════════════════════════════════\n");

    console.log("✅ Gujarati names update completed successfully!");
  } catch (error) {
    console.error("❌ Error during Gujarati names update:", error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the update
if (require.main === module) {
  updateGujaratiNames()
    .then(() => {
      console.log("\n✨ Script execution completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script execution failed:", error);
      process.exit(1);
    });
}

module.exports = updateGujaratiNames;
