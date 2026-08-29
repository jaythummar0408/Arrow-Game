const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/v1/market-prices";

/**
 * Test 1: Get last 7 days data for Gujarat
 */
const testLast7Days = async () => {
  try {
    console.log("\n📊 Test 1: Last 7 Days - Gujarat\n");
    console.log("=".repeat(60));

    const response = await axios.get(BASE_URL, {
      params: {
        days: 7,
        state: "Gujarat",
        populate: "true",
        limit: 5,
      },
    });

    console.log(`✅ Status: ${response.data.success}`);
    console.log(`📈 Total Records: ${response.data.pagination.totalRecords}`);
    console.log(
      `📄 Current Page: ${response.data.pagination.currentPage}/${response.data.pagination.totalPages}`,
    );
    console.log(`\n📝 Sample Record:`);
    if (response.data.data[0]) {
      const record = response.data.data[0];
      console.log(`   State: ${record.state.name}`);
      console.log(`   District: ${record.district.name}`);
      console.log(`   Market: ${record.market.name}`);
      console.log(`   Commodity: ${record.commodity.name}`);
      console.log(`   Variety: ${record.variety.name}`);
      console.log(`   Grade: ${record.grade.name}`);
      console.log(
        `   Date: ${new Date(record.arrival_date).toLocaleDateString()}`,
      );
      console.log(`   Min Price: ₹${record.min_price}`);
      console.log(`   Max Price: ₹${record.max_price}`);
      console.log(`   Modal Price: ₹${record.modal_price}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

/**
 * Test 2: Get last 15 days with commodity filter
 */
const testLast15DaysCommodity = async () => {
  try {
    console.log("\n\n📊 Test 2: Last 15 Days - Soyabean\n");
    console.log("=".repeat(60));

    const response = await axios.get(BASE_URL, {
      params: {
        days: 15,
        commodity: "Soyabean",
        populate: "true",
        sortBy: "modal_price",
        sortOrder: "desc",
        limit: 5,
      },
    });

    console.log(`✅ Status: ${response.data.success}`);
    console.log(`📈 Total Records: ${response.data.pagination.totalRecords}`);
    console.log(`\n📝 Top 5 by Modal Price:`);
    response.data.data.forEach((record, index) => {
      console.log(
        `   ${index + 1}. ${record.market.name} - ₹${record.modal_price}`,
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

/**
 * Test 3: Get last 30 days with district and market filters
 */
const testLast30DaysMarket = async () => {
  try {
    console.log("\n\n📊 Test 3: Last 30 Days - Amreli District\n");
    console.log("=".repeat(60));

    const response = await axios.get(BASE_URL, {
      params: {
        days: 30,
        state: "Gujarat",
        district: "Amreli",
        populate: "true",
        limit: 5,
      },
    });

    console.log(`✅ Status: ${response.data.success}`);
    console.log(`📈 Total Records: ${response.data.pagination.totalRecords}`);
    console.log(`\n📝 Markets in Amreli:`);
    const uniqueMarkets = [
      ...new Set(response.data.data.map((r) => r.market.name)),
    ];
    uniqueMarkets.forEach((market, index) => {
      console.log(`   ${index + 1}. ${market}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

/**
 * Test 4: Get statistics
 */
const testStatistics = async () => {
  try {
    console.log("\n\n📊 Test 4: Statistics (Last 30 Days)\n");
    console.log("=".repeat(60));

    const response = await axios.get(`${BASE_URL}/stats`, {
      params: {
        days: 30,
        state: "Gujarat",
      },
    });

    console.log(`✅ Status: ${response.data.success}`);
    console.log(`\n📈 Overall Statistics:`);
    const stats = response.data.overallStats;
    console.log(`   Total Records: ${stats.totalRecords}`);
    console.log(`   Avg Modal Price: ₹${Math.round(stats.avgModalPrice)}`);
    console.log(`   Min Modal Price: ₹${stats.minModalPrice}`);
    console.log(`   Max Modal Price: ₹${stats.maxModalPrice}`);

    console.log(`\n🏆 Top 5 Commodities:`);
    response.data.topCommodities.slice(0, 5).forEach((item, index) => {
      console.log(
        `   ${index + 1}. ${item.commodity} - ${item.count} records (Avg: ₹${item.avgPrice})`,
      );
    });

    console.log(`\n🏪 Top 5 Markets:`);
    response.data.topMarkets.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.market} - ${item.count} records`);
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

/**
 * Test 5: Get filter options
 */
const testFilterOptions = async () => {
  try {
    console.log("\n\n📊 Test 5: Available Filter Options\n");
    console.log("=".repeat(60));

    const response = await axios.get(`${BASE_URL}/filters`);

    console.log(`✅ Status: ${response.data.success}`);
    console.log(`\n📍 States: ${response.data.filters.states.length}`);
    console.log(`   ${response.data.filters.states.slice(0, 5).join(", ")}...`);

    console.log(
      `\n🌾 Commodities: ${response.data.filters.commodities.length}`,
    );
    response.data.filters.commodities.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (Code: ${item.code})`);
    });

    console.log(`\n🔖 Varieties: ${response.data.filters.varieties.length}`);
    console.log(
      `   ${response.data.filters.varieties.slice(0, 5).join(", ")}...`,
    );

    console.log(`\n⭐ Grades: ${response.data.filters.grades.length}`);
    console.log(`   ${response.data.filters.grades.join(", ")}`);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

/**
 * Test 6: Price range filter
 */
const testPriceRange = async () => {
  try {
    console.log("\n\n📊 Test 6: Price Range Filter (₹5000-₹7000)\n");
    console.log("=".repeat(60));

    const response = await axios.get(BASE_URL, {
      params: {
        days: 30,
        minPrice: 5000,
        maxPrice: 7000,
        populate: "true",
        sortBy: "modal_price",
        sortOrder: "asc",
        limit: 5,
      },
    });

    console.log(`✅ Status: ${response.data.success}`);
    console.log(`📈 Total Records: ${response.data.pagination.totalRecords}`);
    console.log(`\n📝 Price Range Results:`);
    response.data.data.forEach((record, index) => {
      console.log(
        `   ${index + 1}. ${record.commodity.name} - ₹${record.modal_price} (${record.market.name})`,
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

/**
 * Test 7: Pagination
 */
const testPagination = async () => {
  try {
    console.log("\n\n📊 Test 7: Pagination (Page 2, Limit 10)\n");
    console.log("=".repeat(60));

    const response = await axios.get(BASE_URL, {
      params: {
        days: 7,
        page: 2,
        limit: 10,
        populate: "true",
      },
    });

    console.log(`✅ Status: ${response.data.success}`);
    const pagination = response.data.pagination;
    console.log(
      `📄 Page: ${pagination.currentPage} of ${pagination.totalPages}`,
    );
    console.log(`📊 Showing: ${response.data.count} records`);
    console.log(`📈 Total Records: ${pagination.totalRecords}`);
    console.log(`   Has Next: ${pagination.hasNext}`);
    console.log(`   Has Previous: ${pagination.hasPrev}`);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

/**
 * Test 8: Get districts by state
 */
const testDistrictsByState = async () => {
  try {
    console.log("\n\n📊 Test 8: Districts in Gujarat\n");
    console.log("=".repeat(60));

    const response = await axios.get(`${BASE_URL}/districts/Gujarat`);

    console.log(`✅ Status: ${response.data.success}`);
    console.log(`📍 State: ${response.data.state}`);
    console.log(`📊 Total Districts: ${response.data.count}`);
    console.log(`\n🗺️  Districts:`);
    response.data.districts.slice(0, 10).forEach((district, index) => {
      console.log(`   ${index + 1}. ${district}`);
    });
    if (response.data.count > 10) {
      console.log(`   ... and ${response.data.count - 10} more`);
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

// Run all tests
const runAllTests = async () => {
  console.log("\n🚀 Starting Master API Tests...\n");
  console.log("=".repeat(70));

  await testLast7Days();
  await new Promise((resolve) => setTimeout(resolve, 500));

  await testLast15DaysCommodity();
  await new Promise((resolve) => setTimeout(resolve, 500));

  await testLast30DaysMarket();
  await new Promise((resolve) => setTimeout(resolve, 500));

  await testStatistics();
  await new Promise((resolve) => setTimeout(resolve, 500));

  await testFilterOptions();
  await new Promise((resolve) => setTimeout(resolve, 500));

  await testPriceRange();
  await new Promise((resolve) => setTimeout(resolve, 500));

  await testPagination();
  await new Promise((resolve) => setTimeout(resolve, 500));

  await testDistrictsByState();

  console.log("\n\n" + "=".repeat(70));
  console.log("✨ All tests completed!\n");
};

// Execute tests
runAllTests();
