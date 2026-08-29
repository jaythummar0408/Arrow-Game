require("dotenv").config();
const connectDB = require("../config/database");
const {
  State,
  District,
  Market,
  Commodity,
  Variety,
  Grade,
  MarketPrice,
} = require("../models");

const testModels = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log("\n🧪 Testing Models...\n");

    // Test each model
    console.log("✅ State Model:", State.modelName);
    console.log("✅ District Model:", District.modelName);
    console.log("✅ Market Model:", Market.modelName);
    console.log("✅ Commodity Model:", Commodity.modelName);
    console.log("✅ Variety Model:", Variety.modelName);
    console.log("✅ Grade Model:", Grade.modelName);
    console.log("✅ MarketPrice Model:", MarketPrice.modelName);

    console.log("\n✨ All models loaded successfully!");
    console.log(
      "📁 Database collections will be created when you insert data\n",
    );

    // List all collections in database
    const collections = await State.db.db.listCollections().toArray();
    console.log("📋 Current collections in database:");
    if (collections.length === 0) {
      console.log("   (No collections yet - will be created on first insert)");
    } else {
      collections.forEach((col) => console.log(`   - ${col.name}`));
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

testModels();
