/**
 * ========================================
 * COMPREHENSIVE TEST SCRIPT
 * ========================================
 *
 * This script tests the new hourly/nightly sync implementation
 *
 * Usage:
 *   node scripts/testSyncImplementation.js
 */

const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api/v1";
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Helper functions
const printHeader = (text) => {
  console.log(
    `\n${colors.bright}${colors.blue}${"=".repeat(60)}${colors.reset}`,
  );
  console.log(`${colors.bright}${colors.blue}${text}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.blue}${"=".repeat(60)}${colors.reset}\n`,
  );
};

const printSuccess = (text) => {
  console.log(`${colors.green}✅ ${text}${colors.reset}`);
};

const printError = (text) => {
  console.log(`${colors.red}❌ ${text}${colors.reset}`);
};

const printInfo = (text) => {
  console.log(`${colors.cyan}ℹ️  ${text}${colors.reset}`);
};

const printWarning = (text) => {
  console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`);
};

// Test 1: Check if commodities have commodity_code field
async function testCommodityModel() {
  printHeader("TEST 1: Commodity Model Check");

  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/APMC",
    );
    const db = mongoose.connection.db;

    const totalCommodities = await db
      .collection("commodities")
      .countDocuments();
    const withCode = await db.collection("commodities").countDocuments({
      commodity_code: { $ne: null, $exists: true },
    });
    const withoutCode = await db.collection("commodities").countDocuments({
      $or: [{ commodity_code: null }, { commodity_code: { $exists: false } }],
    });

    printInfo(`Total commodities: ${totalCommodities}`);
    printInfo(`With commodity_code: ${withCode}`);
    printInfo(`Without commodity_code: ${withoutCode}`);

    if (totalCommodities > 0) {
      printSuccess("Commodity collection has data");
    } else {
      printWarning("Commodity collection is empty");
    }

    await mongoose.disconnect();
    return true;
  } catch (error) {
    printError(`Database error: ${error.message}`);
    return false;
  }
}

// Test 2: Test hourly sync endpoint
async function testHourlySync() {
  printHeader("TEST 2: Hourly Sync API");

  try {
    printInfo("Calling /sync/hourly endpoint...");
    const startTime = Date.now();

    const response = await axios.post(
      `${API_BASE_URL}/sync/hourly`,
      {},
      {
        timeout: 120000, // 2 minutes
      },
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (response.data.success) {
      printSuccess(`Hourly sync completed in ${duration}s`);
      console.log(`\n   Summary:`);
      console.log(`   - Total: ${response.data.summary.total}`);
      console.log(`   - Created: ${response.data.summary.created}`);
      console.log(`   - Updated: ${response.data.summary.updated}`);
      console.log(`   - Errors: ${response.data.summary.errors}`);

      if (response.data.note) {
        printInfo(response.data.note);
      }

      return true;
    } else {
      printError(`Hourly sync failed: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    printError(`API error: ${error.message}`);
    if (error.response) {
      console.log("   Response:", error.response.data);
    }
    return false;
  }
}

// Test 3: Check today's data in database
async function checkTodayData() {
  printHeader("TEST 3: Check Today's Data in Database");

  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/APMC",
    );
    const db = mongoose.connection.db;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await db.collection("marketprices").countDocuments({
      arrival_date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    printInfo(`Today's records in database: ${todayCount}`);

    if (todayCount > 0) {
      printSuccess("Today's data found in database");

      // Sample a few records
      const samples = await db
        .collection("marketprices")
        .find({ arrival_date: { $gte: today, $lt: tomorrow } })
        .limit(3)
        .toArray();

      console.log(`\n   Sample records:`);
      samples.forEach((record, idx) => {
        console.log(
          `   ${idx + 1}. Commodity: ${record.commodity} | Modal Price: ${record.modal_price}`,
        );
      });
    } else {
      printWarning("No data for today found. Run hourly sync first.");
    }

    await mongoose.disconnect();
    return todayCount > 0;
  } catch (error) {
    printError(`Database error: ${error.message}`);
    return false;
  }
}

// Test 4: Test nightly sync endpoint
async function testNightlySync() {
  printHeader("TEST 4: Nightly Sync API (with Backfill)");

  try {
    printInfo("Calling /sync/yesterday endpoint...");
    const startTime = Date.now();

    const response = await axios.post(
      `${API_BASE_URL}/sync/yesterday`,
      {},
      {
        timeout: 300000, // 5 minutes
      },
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (response.data.success) {
      printSuccess(`Nightly sync completed in ${duration}s`);
      console.log(`\n   Data Processing:`);
      console.log(`   - Total: ${response.data.summary.total}`);
      console.log(`   - Created: ${response.data.summary.created}`);
      console.log(`   - Updated: ${response.data.summary.updated}`);
      console.log(`   - Errors: ${response.data.summary.errors}`);

      if (response.data.backfillSummary) {
        console.log(`\n   Commodity Code Backfill:`);
        console.log(`   - Total: ${response.data.backfillSummary.total}`);
        console.log(`   - Updated: ${response.data.backfillSummary.updated}`);
        console.log(`   - Skipped: ${response.data.backfillSummary.skipped}`);
        console.log(`   - Errors: ${response.data.backfillSummary.errors}`);
      }

      return true;
    } else {
      printError(`Nightly sync failed: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    printError(`API error: ${error.message}`);
    if (error.response) {
      console.log("   Response:", error.response.data);
    }
    return false;
  }
}

// Test 5: Test analytics performance
async function testAnalyticsPerformance() {
  printHeader("TEST 5: Analytics API Performance");

  try {
    // First, get a market ID
    printInfo("Fetching available markets...");
    const marketsResponse = await axios.get(
      `${API_BASE_URL}/market-prices/filters`,
    );

    if (
      !marketsResponse.data.success ||
      !marketsResponse.data.filters.states[0]
    ) {
      printWarning("No markets found. Cannot test analytics.");
      return false;
    }

    // Get first state
    const stateName = marketsResponse.data.filters.states[0].name;
    printInfo(`Using state: ${stateName}`);

    // Get districts
    const districtsResponse = await axios.get(
      `${API_BASE_URL}/market-prices/districts/${stateName}`,
    );
    if (!districtsResponse.data.success || districtsResponse.data.count === 0) {
      printWarning("No districts found. Cannot test analytics.");
      return false;
    }

    // Get first district's markets
    const districtId = districtsResponse.data.districts[0].id;
    const marketsListResponse = await axios.get(
      `${API_BASE_URL}/market-prices/markets/${districtId}`,
    );

    if (
      !marketsListResponse.data.success ||
      marketsListResponse.data.count === 0
    ) {
      printWarning("No markets found. Cannot test analytics.");
      return false;
    }

    const marketId = marketsListResponse.data.markets[0].id;
    const marketName = marketsListResponse.data.markets[0].name;

    printInfo(`Testing analytics for market: ${marketName} (${marketId})`);
    printInfo("Calling analytics endpoint...");

    const startTime = Date.now();
    const response = await axios.get(
      `${API_BASE_URL}/analytics/market/${marketId}`,
    );
    const endTime = Date.now();

    const duration = endTime - startTime;

    if (response.data.success) {
      printSuccess(`Analytics API responded in ${duration}ms`);

      if (duration < 1000) {
        printSuccess(
          "✨ EXCELLENT! Response time is under 1 second (Target achieved!)",
        );
      } else if (duration < 1500) {
        printInfo(
          "Good! Response time is acceptable, but can be optimized further.",
        );
      } else {
        printWarning(`Response time is ${duration}ms. Expected < 1000ms`);
      }

      // Show summary
      const summary = response.data.analytics.summary;
      console.log(`\n   Data Summary:`);
      console.log(
        `   - Today's Records: ${summary.totalTodayRecords || summary.totalLiveRecords || 0}`,
      );
      console.log(`   - Historical Records: ${summary.totalHistoricalRecords}`);
      console.log(`   - Updated Today: ${summary.commoditiesUpdatedToday}`);
      console.log(
        `   - Not Updated Today: ${summary.commoditiesNotUpdatedToday}`,
      );

      return true;
    } else {
      printError("Analytics API failed");
      return false;
    }
  } catch (error) {
    printError(`API error: ${error.message}`);
    if (error.response) {
      console.log("   Response:", error.response.data);
    }
    return false;
  }
}

// Test 6: Verify backfill worked
async function verifyBackfill() {
  printHeader("TEST 6: Verify Commodity Code Backfill");

  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/APMC",
    );
    const db = mongoose.connection.db;

    const totalCommodities = await db
      .collection("commodities")
      .countDocuments();
    const withoutCode = await db.collection("commodities").countDocuments({
      $or: [{ commodity_code: null }, { commodity_code: { $exists: false } }],
    });

    printInfo(`Total commodities: ${totalCommodities}`);
    printInfo(`Without commodity_code: ${withoutCode}`);

    const backfillPercentage = (
      ((totalCommodities - withoutCode) / totalCommodities) *
      100
    ).toFixed(2);
    printInfo(`Backfill completion: ${backfillPercentage}%`);

    if (withoutCode === 0) {
      printSuccess(
        "🎉 All commodities have commodity_code! Backfill complete.",
      );
    } else if (withoutCode < 10) {
      printSuccess(`Only ${withoutCode} commodities without code. Good!`);
    } else {
      printWarning(
        `${withoutCode} commodities still without code. They will be backfilled in next nightly sync.`,
      );
    }

    await mongoose.disconnect();
    return true;
  } catch (error) {
    printError(`Database error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     🧪 APMC KHETIVADI - SYNC IMPLEMENTATION TESTS         ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(colors.reset);

  const results = {
    passed: 0,
    failed: 0,
    total: 6,
  };

  // Run tests sequentially
  const tests = [
    { name: "Commodity Model Check", fn: testCommodityModel },
    { name: "Hourly Sync", fn: testHourlySync },
    { name: "Today's Data Check", fn: checkTodayData },
    { name: "Nightly Sync", fn: testNightlySync },
    { name: "Analytics Performance", fn: testAnalyticsPerformance },
    { name: "Backfill Verification", fn: verifyBackfill },
  ];

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      printError(`Test "${test.name}" crashed: ${error.message}`);
      results.failed++;
    }

    // Wait a bit between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Print summary
  printHeader("TEST SUMMARY");
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

  if (results.failed === 0) {
    console.log(
      `\n${colors.bright}${colors.green}🎉 ALL TESTS PASSED! Implementation is working correctly.${colors.reset}\n`,
    );
  } else {
    console.log(
      `\n${colors.bright}${colors.yellow}⚠️  Some tests failed. Please review the errors above.${colors.reset}\n`,
    );
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
  printError(`Fatal error: ${error.message}`);
  process.exit(1);
});
