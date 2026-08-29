/**
 * Test Script for Commodity Comparison API
 *
 * This script tests the comparison API endpoint that compares
 * commodity prices across two different markets
 *
 * Usage: node scripts/testCompareAPI.js
 */

const axios = require("axios");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const API_BASE_URL = "http://localhost:5000/api/v1";

// Helper function to format section headers
function printHeader(text) {
  console.log(
    `\n${colors.bright}${colors.cyan}========================================`,
  );
  console.log(`${text}`);
  console.log(`========================================${colors.reset}\n`);
}

// Helper function to print success
function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

// Helper function to print error
function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

// Helper function to print info
function printInfo(text) {
  console.log(`${colors.blue}ℹ ${text}${colors.reset}`);
}

// Step 1: Get markets list
async function getMarketsList() {
  printHeader("STEP 1: Get Markets List");

  try {
    const response = await axios.get(`${API_BASE_URL}/analytics/markets`);

    if (response.data.success && response.data.markets.length > 0) {
      printSuccess(`Found ${response.data.markets.length} markets`);

      // Show first 5 markets
      console.log("\nFirst 5 markets:");
      response.data.markets.slice(0, 5).forEach((market, idx) => {
        console.log(
          `  ${idx + 1}. ${market.name} (${market.district}) - ID: ${market.id}`,
        );
      });

      // Return first two markets for comparison
      return response.data.markets.slice(0, 2);
    } else {
      printError("No markets found");
      return null;
    }
  } catch (error) {
    printError(`Failed to fetch markets: ${error.message}`);
    return null;
  }
}

// Step 2: Get market analytics to find commodities
async function getMarketCommodities(marketId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/analytics/market/${marketId}`,
    );

    if (
      response.data.success &&
      response.data.analytics.allUniqueCommodity.length > 0
    ) {
      return response.data.analytics.allUniqueCommodity;
    } else {
      return null;
    }
  } catch (error) {
    printError(`Failed to fetch commodities: ${error.message}`);
    return null;
  }
}

// Step 3: Test compare API
async function testCompareAPI(commodityId, marketIdA, marketIdB, days = 7) {
  printHeader(`STEP 2: Compare Commodity Prices (${days} days)`);

  try {
    printInfo(`Comparing commodity ${commodityId}`);
    printInfo(`Market A: ${marketIdA}`);
    printInfo(`Market B: ${marketIdB}`);
    printInfo(`Period: ${days} days\n`);

    const response = await axios.get(`${API_BASE_URL}/analytics/compare`, {
      params: {
        commodityId,
        marketIdA,
        marketIdB,
        days,
      },
    });

    if (response.data.success) {
      printSuccess("Comparison completed successfully!\n");

      const data = response.data;

      // Display commodity info
      console.log(`${colors.bright}Commodity:${colors.reset}`);
      console.log(
        `  Name: ${data.commodity.commodityName} (${data.commodity.commodityName_gj})`,
      );
      console.log(`  Code: ${data.commodity.commodityCode}`);

      // Display period
      console.log(`\n${colors.bright}Period:${colors.reset}`);
      console.log(
        `  Days: ${data.period.days} days (${data.period.from} to ${data.period.to})`,
      );

      // Display Market A info
      console.log(
        `\n${colors.bright}${colors.green}Market A: ${data.comparison.marketA.marketName}${colors.reset}`,
      );
      console.log(`  District: ${data.comparison.marketA.district}`);
      console.log(`  State: ${data.comparison.marketA.state}`);
      console.log(`  Current Price: ₹${data.comparison.marketA.currentPrice}`);
      console.log(`  Min Price: ₹${data.comparison.marketA.minPrice}`);
      console.log(`  Max Price: ₹${data.comparison.marketA.maxPrice}`);
      console.log(`  Avg Price: ₹${data.comparison.marketA.avgPrice}`);
      console.log(
        `  Trend: ${data.comparison.marketA.trend} (${data.comparison.marketA.changePercent}%)`,
      );
      console.log(`  Last Updated: ${data.comparison.marketA.lastUpdated}`);
      console.log(
        `  Price Records: ${data.comparison.marketA.priceHistory.length}`,
      );

      // Display Market B info
      console.log(
        `\n${colors.bright}${colors.yellow}Market B: ${data.comparison.marketB.marketName}${colors.reset}`,
      );
      console.log(`  District: ${data.comparison.marketB.district}`);
      console.log(`  State: ${data.comparison.marketB.state}`);
      console.log(`  Current Price: ₹${data.comparison.marketB.currentPrice}`);
      console.log(`  Min Price: ₹${data.comparison.marketB.minPrice}`);
      console.log(`  Max Price: ₹${data.comparison.marketB.maxPrice}`);
      console.log(`  Avg Price: ₹${data.comparison.marketB.avgPrice}`);
      console.log(
        `  Trend: ${data.comparison.marketB.trend} (${data.comparison.marketB.changePercent}%)`,
      );
      console.log(`  Last Updated: ${data.comparison.marketB.lastUpdated}`);
      console.log(
        `  Price Records: ${data.comparison.marketB.priceHistory.length}`,
      );

      // Display comparison summary
      console.log(
        `\n${colors.bright}${colors.cyan}Comparison Summary:${colors.reset}`,
      );
      console.log(`  Price Difference: ₹${data.comparison.priceDifference}`);
      console.log(
        `  Difference Percent: ${data.comparison.priceDifferencePercent}%`,
      );
      console.log(`  Cheaper Market: ${data.comparison.cheaperMarket}`);
      console.log(
        `  ${colors.bright}Recommendation: ${data.comparison.recommendation}${colors.reset}`,
      );

      // Display price history sample
      if (data.comparison.marketA.priceHistory.length > 0) {
        console.log(
          `\n${colors.bright}Market A - Recent Price History (last 3):${colors.reset}`,
        );
        data.comparison.marketA.priceHistory
          .slice(0, 3)
          .forEach((record, idx) => {
            const date = new Date(record.date).toISOString().split("T")[0];
            console.log(
              `  ${idx + 1}. ${date}: ₹${record.modalPrice} (min: ₹${record.minPrice}, max: ₹${record.maxPrice})`,
            );
          });
      }

      if (data.comparison.marketB.priceHistory.length > 0) {
        console.log(
          `\n${colors.bright}Market B - Recent Price History (last 3):${colors.reset}`,
        );
        data.comparison.marketB.priceHistory
          .slice(0, 3)
          .forEach((record, idx) => {
            const date = new Date(record.date).toISOString().split("T")[0];
            console.log(
              `  ${idx + 1}. ${date}: ₹${record.modalPrice} (min: ₹${record.minPrice}, max: ₹${record.maxPrice})`,
            );
          });
      }

      return true;
    } else {
      printError("Comparison failed");
      return false;
    }
  } catch (error) {
    printError(`Failed to compare prices: ${error.message}`);
    if (error.response && error.response.data) {
      console.log("Error details:", error.response.data);
    }
    return false;
  }
}

// Test with different day periods
async function testDifferentPeriods(commodityId, marketIdA, marketIdB) {
  printHeader("STEP 3: Test Different Time Periods");

  const periods = [7, 15, 30];

  for (const days of periods) {
    console.log(
      `\n${colors.bright}Testing with ${days} days period:${colors.reset}`,
    );

    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/compare`, {
        params: {
          commodityId,
          marketIdA,
          marketIdB,
          days,
        },
      });

      if (response.data.success) {
        printSuccess(
          `${days} days: Success - ${response.data.comparison.marketA.priceHistory.length} records in Market A, ${response.data.comparison.marketB.priceHistory.length} records in Market B`,
        );
      } else {
        printError(`${days} days: Failed`);
      }
    } catch (error) {
      printError(`${days} days: Error - ${error.message}`);
    }
  }
}

// Test error scenarios
async function testErrorScenarios() {
  printHeader("STEP 4: Test Error Scenarios");

  // Test missing parameters
  console.log(`${colors.bright}Test 1: Missing commodityId${colors.reset}`);
  try {
    await axios.get(`${API_BASE_URL}/analytics/compare`, {
      params: {
        marketIdA: "123",
        marketIdB: "456",
        days: 7,
      },
    });
    printError("Should have failed but succeeded");
  } catch (error) {
    if (error.response && error.response.status === 400) {
      printSuccess("Correctly returned 400 error for missing commodityId");
    } else {
      printError(`Unexpected error: ${error.message}`);
    }
  }

  // Test invalid days
  console.log(
    `\n${colors.bright}Test 2: Invalid days parameter${colors.reset}`,
  );
  try {
    await axios.get(`${API_BASE_URL}/analytics/compare`, {
      params: {
        commodityId: "123",
        marketIdA: "456",
        marketIdB: "789",
        days: 45,
      },
    });
    printError("Should have failed but succeeded");
  } catch (error) {
    if (error.response && error.response.status === 400) {
      printSuccess("Correctly returned 400 error for invalid days parameter");
    } else {
      printError(`Unexpected error: ${error.message}`);
    }
  }

  // Test invalid commodity ID
  console.log(`\n${colors.bright}Test 3: Invalid commodity ID${colors.reset}`);
  try {
    await axios.get(`${API_BASE_URL}/analytics/compare`, {
      params: {
        commodityId: "000000000000000000000000",
        marketIdA: "000000000000000000000001",
        marketIdB: "000000000000000000000002",
        days: 7,
      },
    });
    printError("Should have failed but succeeded");
  } catch (error) {
    if (error.response && error.response.status === 404) {
      printSuccess("Correctly returned 404 error for invalid commodity ID");
    } else {
      printError(`Unexpected error: ${error.message}`);
    }
  }
}

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║   COMMODITY COMPARISON API - TEST SUITE           ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log(colors.reset);

  try {
    // Step 1: Get markets
    const markets = await getMarketsList();
    if (!markets || markets.length < 2) {
      printError("Need at least 2 markets to test comparison");
      return;
    }

    const marketA = markets[0];
    const marketB = markets[1];

    printInfo(`Using Market A: ${marketA.name} (ID: ${marketA.id})`);
    printInfo(`Using Market B: ${marketB.name} (ID: ${marketB.id})`);

    // Get commodities from first market
    printInfo("Fetching commodities from Market A...");
    const commodities = await getMarketCommodities(marketA.id);

    if (!commodities || commodities.length === 0) {
      printError("No commodities found in Market A");
      return;
    }

    printSuccess(`Found ${commodities.length} commodities`);
    const commodity = commodities[0];
    printInfo(
      `Using commodity: ${commodity.commodity} (ID: ${commodity.commodityId})`,
    );

    // Step 2: Test basic comparison
    await testCompareAPI(commodity.commodityId, marketA.id, marketB.id, 7);

    // Step 3: Test different periods
    await testDifferentPeriods(commodity.commodityId, marketA.id, marketB.id);

    // Step 4: Test error scenarios
    await testErrorScenarios();

    // Final summary
    printHeader("TEST SUITE COMPLETED");
    printSuccess("All tests completed successfully!");

    console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
    console.log("1. Test the API with your own market and commodity IDs");
    console.log("2. Try different time periods (7, 15, 30 days)");
    console.log(
      "3. Integrate this endpoint with your frontend for price comparison",
    );
    console.log("4. Use the priceHistory arrays to create comparison charts");
  } catch (error) {
    printError(`Test suite failed: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
runTests();
