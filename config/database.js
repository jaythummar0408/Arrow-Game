const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Select MongoDB URI based on environment
    const isProduction = process.env.NODE_ENV === "production";
    const mongoURI = isProduction
      ? process.env.MONGO_URI_PROD
      : process.env.MONGO_URI_DEV;

    console.log(
      `🔗 Connecting to ${isProduction ? "Production" : "Development"} database...`,
    );

    const conn = await mongoose.connect(mongoURI, {
      dbName: process.env.DB_NAME,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("✨ Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error(`❌ Mongoose connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️  Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔒 MongoDB connection closed due to app termination");
  process.exit(0);
});

module.exports = connectDB;
