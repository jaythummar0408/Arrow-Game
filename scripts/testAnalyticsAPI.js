/**
 * Test Analytics API
 * Tests the market analytics endpoints
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000";

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  section: (msg) =>
    console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

async function testAnalyticsAPI() {
  try {
    log.section("=== Testing Analytics API ===");

    // Test 1: Get markets list
    log.section("\n🏪 Test 1: Get Markets List");
    const marketsResponse = await axios.get(
      `${BASE_URL}/api/v1/analytics/markets`,
    );
    log.success(`Markets found: ${marketsResponse.data.count}`);

    if (marketsResponse.data.count > 0) {
      const firstMarket = marketsResponse.data.markets[0];
      log.info(
        `First market: ${firstMarket.name} (${firstMarket.district}, ${firstMarket.state})`,
      );
      log.info(`Market ID: ${firstMarket.id}`);

      // Test 2: Get market analytics
      log.section("\n📊 Test 2: Get Market Analytics");
      const analyticsResponse = await axios.get(
        `${BASE_URL}/api/v1/analytics/market/${firstMarket.id}`,
      );

      const analytics = analyticsResponse.data.analytics;
      const summary = analytics.summary;

      log.success("Analytics generated successfully!");
      log.info(`Market: ${analyticsResponse.data.market.marketName}`);
      log.info(`Date: ${analyticsResponse.data.date}`);

      log.section("\n📈 Summary Statistics:");
      console.log(`  Total Live Records: ${summary.totalLiveRecords}`);
      console.log(
        `  Total Historical Records: ${summary.totalHistoricalRecords}`,
      );
      console.log(`  Unique Commodities: ${summary.uniqueCommodities}`);
      console.log(
        `  Commodities Updated Today: ${summary.commoditiesUpdatedToday}`,
      );
      console.log(
        `  Commodities Not Updated Today: ${summary.commoditiesNotUpdatedToday}`,
      );
      console.log(
        `  New Commodities Added Today: ${summary.newCommoditiesAddedToday}`,
      );

      log.section("\n📈 Price Hikes:");
      if (analytics.priceHikes.length > 0) {
        console.log(`  Total: ${analytics.priceHikes.length} commodities`);
        analytics.priceHikes.slice(0, 5).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.commodity} (${item.variety})`);
          console.log(
            `     Last Price: ₹${item.lastPrice} → Current: ₹${item.currentPrice}`,
          );
          console.log(
            `     Change: ${item.priceChangePercent > 0 ? "+" : ""}${item.priceChangePercent}% (₹${item.priceDifference})`,
          );
        });
      } else {
        console.log("  No price hikes found");
      }

      log.section("\n📉 Price Drops:");
      if (analytics.priceDrops.length > 0) {
        console.log(`  Total: ${analytics.priceDrops.length} commodities`);
        analytics.priceDrops.slice(0, 5).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.commodity} (${item.variety})`);
          console.log(
            `     Last Price: ₹${item.lastPrice} → Current: ₹${item.currentPrice}`,
          );
          console.log(
            `     Change: ${item.priceChangePercent}% (₹${item.priceDifference})`,
          );
        });
      } else {
        console.log("  No price drops found");
      }

      log.section("\n🆕 New Commodities Added Today:");
      if (analytics.newCommodities.length > 0) {
        console.log(`  Total: ${analytics.newCommodities.length} commodities`);
        analytics.newCommodities.slice(0, 5).forEach((item, index) => {
          console.log(
            `  ${index + 1}. ${item.commodity} (${item.variety}, ${item.grade})`,
          );
          console.log(
            `     Price: ₹${item.currentPrice} (Min: ₹${item.minPrice}, Max: ₹${item.maxPrice})`,
          );
        });
      } else {
        console.log("  No new commodities");
      }

      log.section("\n⏸️  Commodities Not Updated Today:");
      if (analytics.notUpdatedToday.length > 0) {
        console.log(`  Total: ${analytics.notUpdatedToday.length} commodities`);
        analytics.notUpdatedToday.slice(0, 5).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.commodity} (${item.variety})`);
          console.log(
            `     Last Price: ₹${item.lastPrice} on ${new Date(item.lastPriceDate).toLocaleDateString()}`,
          );
          if (item.lastPriceChange) {
            console.log(
              `     Last Change: ${item.lastTrend === "up" ? "🔺" : item.lastTrend === "down" ? "🔻" : "➡️"} ${item.lastPriceChangePercent}%`,
            );
          }
        });
      } else {
        console.log("  All commodities updated today");
      }

      log.section("\n💰 Highest & Lowest Prices:");
      if (analytics.highestPrice) {
        console.log(
          `  🔝 Highest: ${analytics.highestPrice.commodity} (${analytics.highestPrice.variety})`,
        );
        console.log(
          `     Price: ₹${analytics.highestPrice.modalPrice} (Min: ₹${analytics.highestPrice.minPrice}, Max: ₹${analytics.highestPrice.maxPrice})`,
        );
      }
      if (analytics.lowestPrice) {
        console.log(
          `  💵 Lowest: ${analytics.lowestPrice.commodity} (${analytics.lowestPrice.variety})`,
        );
        console.log(
          `     Price: ₹${analytics.lowestPrice.modalPrice} (Min: ₹${analytics.lowestPrice.minPrice}, Max: ₹${analytics.lowestPrice.maxPrice})`,
        );
      }

      // Test 3: Get markets by state filter
      log.section("\n🌍 Test 3: Get Markets by State (Gujarat)");
      const gujaratMarkets = await axios.get(
        `${BASE_URL}/api/v1/analytics/markets?state=Gujarat`,
      );
      log.success(`Gujarat markets: ${gujaratMarkets.data.count}`);

      // Test 4: Get markets by district filter
      if (gujaratMarkets.data.count > 0) {
        const sampleDistrict = gujaratMarkets.data.markets[0].district;
        log.section(
          `\n🏛️  Test 4: Get Markets by District (${sampleDistrict})`,
        );
        const districtMarkets = await axios.get(
          `${BASE_URL}/api/v1/analytics/markets?district=${sampleDistrict}`,
        );
        log.success(
          `Markets in ${sampleDistrict}: ${districtMarkets.data.count}`,
        );
        districtMarkets.data.markets.forEach((market, index) => {
          if (index < 5) {
            console.log(`  ${index + 1}. ${market.name} (ID: ${market.id})`);
          }
        });
      }

      log.section("\n✅ All Analytics API Tests Completed Successfully!");
    } else {
      log.error("No markets found in database. Please sync data first.");
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Status:", error.response.status);
    }
    process.exit(1);
  }
}

// Run tests
console.log(
  `${colors.bright}${colors.blue}Starting Analytics API Tests...${colors.reset}\n`,
);
testAnalyticsAPI()
  .then(() => {
    console.log(
      `\n${colors.green}${colors.bright}All tests passed! ✓${colors.reset}`,
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error(
      `\n${colors.red}${colors.bright}Tests failed! ✗${colors.reset}`,
    );
    console.error(error);
    process.exit(1);
  });
