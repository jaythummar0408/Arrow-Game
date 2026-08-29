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

const initializeCollections = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log("\n🚀 Initializing all collections...\n");

    // Create collections by creating indexes
    await State.createCollection();
    console.log("✅ States collection created");

    await District.createCollection();
    console.log("✅ Districts collection created");

    await Market.createCollection();
    console.log("✅ Markets collection created");

    await Commodity.createCollection();
    console.log("✅ Commodities collection created");

    await Variety.createCollection();
    console.log("✅ Varieties collection created");

    await Grade.createCollection();
    console.log("✅ Grades collection created");

    await MarketPrice.createCollection();
    console.log("✅ MarketPrices collection created");

    // List all collections
    console.log("\n📋 All collections in APMC database:");
    const collections = await State.db.db.listCollections().toArray();
    collections.forEach((col) => console.log(`   - ${col.name}`));

    console.log("\n✨ All collections initialized successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

initializeCollections();
