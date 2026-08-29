// Example usage of Data.gov.in API functions
require("dotenv").config();
const {
  fetchHistoricalPrices,
  fetchDailyPrices,
  fetchTodayPrices,
  getTodayDate,
} = require("../utils/dataGovApi");

// Example 1: Fetch Historical Prices
const testHistoricalPrices = async () => {
  console.log("📊 Testing Historical Prices API...\n");

  const result = await fetchHistoricalPrices(
    {
      state: "Gujarat",
      district: "Junagarh",
      commodity: "Soyabean",
      market: "",
      variety: "",
      grade: "",
    },
    2000,
  );

  if (result.success) {
    console.log("✅ Historical Prices fetched successfully");
    console.log(`📈 Total records: ${result.count}`);
    console.log("📝 Sample record:", result.data.records?.[0] || "No records");
  } else {
    console.log("❌ Error:", result.error);
  }
  console.log("\n" + "=".repeat(60) + "\n");
};

// Example 2: Fetch Daily Prices
const testDailyPrices = async () => {
  console.log("📅 Testing Daily Prices API...\n");

  const result = await fetchDailyPrices(
    {
      state: "Gujarat",
      district: "Amreli",
      commodity: "Soyabean",
      arrivalDate: "10-02-2026",
    },
    3000,
  );

  if (result.success) {
    console.log("✅ Daily Prices fetched successfully");
    console.log(`📈 Total records: ${result.count}`);
    console.log("📝 Sample record:", result.data.records?.[0] || "No records");
  } else {
    console.log("❌ Error:", result.error);
  }
  console.log("\n" + "=".repeat(60) + "\n");
};

// Example 3: Fetch Today's Prices
const testTodayPrices = async () => {
  console.log("🌅 Testing Today's Prices API...\n");
  console.log(`📆 Today's date: ${getTodayDate()}\n`);

  const result = await fetchTodayPrices({
    state: "Gujarat",
    district: "Amreli",
    commodity: "Soyabean",
  });

  if (result.success) {
    console.log("✅ Today's Prices fetched successfully");
    console.log(`📈 Total records: ${result.count}`);
    console.log("📝 Sample record:", result.data.records?.[0] || "No records");
  } else {
    console.log("❌ Error:", result.error);
  }
  console.log("\n" + "=".repeat(60) + "\n");
};

// Run all tests
const runTests = async () => {
  console.log("\n🚀 Starting API Tests...\n");
  console.log("=".repeat(60) + "\n");

  await testHistoricalPrices();
  await testDailyPrices();
  await testTodayPrices();

  console.log("✨ All tests completed!\n");
};

// Execute tests
runTests();
