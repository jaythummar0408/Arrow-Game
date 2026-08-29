const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1";

/**
 * Test sync yesterday's data
 */
const testSyncYesterday = async () => {
  try {
    console.log("\n🔄 Testing: Sync Yesterday's Data\n");
    console.log("=".repeat(60));

    const response = await axios.post(`${BASE_URL}/sync/yesterday`);

    console.log("\n✅ Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

/**
 * Test sync specific date
 */
const testSyncSpecificDate = async () => {
  try {
    console.log("\n\n🔄 Testing: Sync Specific Date\n");
    console.log("=".repeat(60));

    const response = await axios.post(`${BASE_URL}/sync/date`, {
      date: "10-02-2026",
      state: "Gujarat",
    });

    console.log("\n✅ Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

/**
 * Test get sync status
 */
const testSyncStatus = async () => {
  try {
    console.log("\n\n📊 Testing: Get Sync Status\n");
    console.log("=".repeat(60));

    const response = await axios.get(`${BASE_URL}/sync/status`);

    console.log("\n✅ Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

// Run all tests
const runTests = async () => {
  console.log("\n🚀 Starting Sync API Tests...\n");

  // Test 1: Sync specific date (10-02-2026)
  await testSyncSpecificDate();

  // Add small delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 2: Get sync status
  await testSyncStatus();

  console.log("\n\n✨ All tests completed!\n");
};

// Execute tests
runTests();
