/**
 * Test Script for Commodity Analytics API
 * Tests the new commodity-specific analytics endpoint
 */

const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3000/api/v1";
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Helper function to print colored output
function print(message, color = "reset") {
  console.log(colors[color] + message + colors.reset);
}

// Helper function to print section headers
function printHeader(title) {
  console.log("\n" + "=".repeat(60));
  print(title, "bright");
  console.log("=".repeat(60));
}

// Helper function to print subsection
function printSection(title) {
  console.log("\n" + "-".repeat(40));
  print(title, "cyan");
  console.log("-".repeat(40));
}

/**
 * Test 1: Get a market and commodity IDs
 */
async function getTestIds() {
  try {
    printHeader("Step 1: Getting Test Market and Commodity IDs");

    // Get markets list
    print("\nFetching markets list...", "blue");
    const marketsResponse = await axios.get(`${BASE_URL}/analytics/markets`);

    if (!marketsResponse.data.success || !marketsResponse.data.markets.length) {
      print("❌ No markets found!", "red");
      return null;
    }

    const market = marketsResponse.data.markets[0];
    print(`✓ Found market: ${market.name} (${market.name_gj})`, "green");
    print(`  Market ID: ${market.id}`, "yellow");

    // Get commodities list
    print("\nFetching commodities list...", "blue");
    const commoditiesResponse = await axios.get(
      `${BASE_URL}/master/commodities`,
    );

    if (
      !commoditiesResponse.data.success ||
      !commoditiesResponse.data.commodities.length
    ) {
      print("❌ No commodities found!", "red");
      return null;
    }

    const commodity = commoditiesResponse.data.commodities[0];
    print(
      `✓ Found commodity: ${commodity.name} (${commodity.name_gj})`,
      "green",
    );
    print(`  Commodity ID: ${commodity.id}`, "yellow");

    return {
      marketId: market.id,
      marketName: market.name,
      commodityId: commodity.id,
      commodityName: commodity.name,
    };
  } catch (error) {
    print(`❌ Error getting test IDs: ${error.message}`, "red");
    return null;
  }
}

/**
 * Test 2: Test commodity analytics with different time periods
 */
async function testCommodityAnalytics(marketId, commodityId, days) {
  try {
    const url = `${BASE_URL}/analytics/market/${marketId}/commodity/${commodityId}?days=${days}`;
    print(`\nTesting ${days} days period...`, "blue");
    print(`URL: ${url}`, "yellow");

    const response = await axios.get(url);
    const data = response.data;

    if (!data.success) {
      print("❌ API returned success: false", "red");
      return false;
    }

    print("✓ API call successful", "green");

    // Display market and commodity info
    printSection(`Market: ${data.market.marketName}`);
    console.log(`District: ${data.market.district}`);
    console.log(`State: ${data.market.state}`);

    printSection(`Commodity: ${data.commodity.commodityName}`);
    console.log(`Code: ${data.commodity.commodityCode}`);
    console.log(`Gujarati: ${data.commodity.commodityName_gj}`);

    printSection(`Period: ${data.period.days} days`);
    console.log(`From: ${data.period.from}`);
    console.log(`To: ${data.period.to}`);

    // Display analytics
    printSection("Analytics Summary");
    const analytics = data.analytics;
    console.log(
      `Updated Today: ${analytics.isUpdatedToday ? "✓ Yes" : "✗ No"}`,
    );

    if (analytics.isUpdatedToday && analytics.todayPrice) {
      console.log("\n📊 Today's Price:");
      console.log(`  Modal: ₹${analytics.todayPrice.modalPrice}`);
      console.log(`  Min: ₹${analytics.todayPrice.minPrice}`);
      console.log(`  Max: ₹${analytics.todayPrice.maxPrice}`);
    }

    if (!analytics.isUpdatedToday && analytics.latestPrices.length > 0) {
      console.log("\n📋 Latest 3 Prices:");
      analytics.latestPrices.forEach((price, index) => {
        console.log(`  ${index + 1}. ${price.date}`);
        console.log(`     Modal: ₹${price.modalPrice}`);
        console.log(`     Min: ₹${price.minPrice}, Max: ₹${price.maxPrice}`);
      });
    }

    console.log(`\n📈 Price History Records: ${analytics.priceHistory.length}`);

    if (analytics.statistics.totalRecords) {
      printSection("Statistics");
      const stats = analytics.statistics;
      console.log(`Total Records: ${stats.totalRecords}`);
      console.log(`Period: ${stats.period}`);
      console.log("\nModal Price:");
      console.log(`  Current: ₹${stats.modalPrice.current}`);
      console.log(`  Highest: ₹${stats.modalPrice.highest}`);
      console.log(`  Lowest: ₹${stats.modalPrice.lowest}`);
      console.log(`  Average: ₹${stats.modalPrice.average}`);
    }

    if (analytics.trends.recentTrend) {
      printSection("Trend Analysis");
      const recent = analytics.trends.recentTrend;
      const overall = analytics.trends.overallTrend;

      console.log("\nRecent Trend (Day-over-day):");
      const recentIcon =
        recent.direction === "up"
          ? "📈"
          : recent.direction === "down"
            ? "📉"
            : "➡️";
      console.log(
        `  ${recentIcon} ${recent.direction.toUpperCase()}: ₹${recent.change} (${recent.changePercent}%)`,
      );

      console.log("\nOverall Trend:");
      const overallIcon =
        overall.direction === "up"
          ? "📈"
          : overall.direction === "down"
            ? "📉"
            : "➡️";
      console.log(
        `  ${overallIcon} ${overall.direction.toUpperCase()}: ₹${overall.change} (${overall.changePercent}%)`,
      );

      const volatility = analytics.trends.volatility;
      console.log("\nVolatility:");
      console.log(
        `  Range: ₹${volatility.priceRange} (${volatility.priceRangePercent}%)`,
      );

      const movement = analytics.trends.priceMovement;
      console.log("\nPrice Movement:");
      console.log(`  Increases: ${movement.increases}`);
      console.log(`  Decreases: ${movement.decreases}`);
      console.log(`  Stable: ${movement.stable}`);
    }

    return true;
  } catch (error) {
    print(`❌ Error: ${error.message}`, "red");
    if (error.response) {
      console.log("Response data:", error.response.data);
    }
    return false;
  }
}

/**
 * Test 3: Test invalid parameters
 */
async function testErrorCases(marketId, commodityId) {
  printHeader("Step 4: Testing Error Cases");

  // Test invalid days parameter
  try {
    printSection("Test: Invalid days parameter (45)");
    await axios.get(
      `${BASE_URL}/analytics/market/${marketId}/commodity/${commodityId}?days=45`,
    );
    print("❌ Should have returned error for invalid days", "red");
  } catch (error) {
    if (error.response && error.response.status === 400) {
      print("✓ Correctly returned 400 Bad Request", "green");
      console.log(`Message: ${error.response.data.message}`);
    } else {
      print(`❌ Unexpected error: ${error.message}`, "red");
    }
  }

  // Test invalid market ID
  try {
    printSection("Test: Invalid market ID");
    await axios.get(
      `${BASE_URL}/analytics/market/123456789012345678901234/commodity/${commodityId}?days=7`,
    );
    print("❌ Should have returned error for invalid market", "red");
  } catch (error) {
    if (error.response && error.response.status === 404) {
      print("✓ Correctly returned 404 Not Found", "green");
      console.log(`Message: ${error.response.data.message}`);
    } else {
      print(`❌ Unexpected error: ${error.message}`, "red");
    }
  }

  // Test invalid commodity ID
  try {
    printSection("Test: Invalid commodity ID");
    await axios.get(
      `${BASE_URL}/analytics/market/${marketId}/commodity/123456789012345678901234?days=7`,
    );
    print("❌ Should have returned error for invalid commodity", "red");
  } catch (error) {
    if (error.response && error.response.status === 404) {
      print("✓ Correctly returned 404 Not Found", "green");
      console.log(`Message: ${error.response.data.message}`);
    } else {
      print(`❌ Unexpected error: ${error.message}`, "red");
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  print("\n🧪 Starting Commodity Analytics API Tests\n", "bright");
  print(
    "Make sure your server is running on http://localhost:3000\n",
    "yellow",
  );

  // Step 1: Get test IDs
  const testData = await getTestIds();
  if (!testData) {
    print("\n❌ Failed to get test data. Aborting tests.", "red");
    return;
  }

  // Step 2: Test with 7 days
  printHeader("Step 2: Testing with 7 Days Period");
  await testCommodityAnalytics(testData.marketId, testData.commodityId, 7);

  // Step 3: Test with 15 days
  printHeader("Step 2: Testing with 15 Days Period");
  await testCommodityAnalytics(testData.marketId, testData.commodityId, 15);

  // Step 4: Test with 30 days
  printHeader("Step 3: Testing with 30 Days Period");
  await testCommodityAnalytics(testData.marketId, testData.commodityId, 30);

  // Step 5: Test error cases
  await testErrorCases(testData.marketId, testData.commodityId);

  // Summary
  printHeader("Test Summary");
  print("✓ All tests completed!", "green");
  print(
    "\nYou can now integrate this API into your frontend for price charts and analytics.",
    "blue",
  );
  console.log("\nExample URLs:");
  print(
    `  ${BASE_URL}/analytics/market/${testData.marketId}/commodity/${testData.commodityId}?days=7`,
    "cyan",
  );
  print(
    `  ${BASE_URL}/analytics/market/${testData.marketId}/commodity/${testData.commodityId}?days=15`,
    "cyan",
  );
  print(
    `  ${BASE_URL}/analytics/market/${testData.marketId}/commodity/${testData.commodityId}?days=30`,
    "cyan",
  );
}

// Run tests
runTests().catch((error) => {
  print(`\n❌ Test runner failed: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
