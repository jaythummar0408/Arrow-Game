/**
 * Price Alert API Test Script
 * Tests the simplified alert functionality
 */

const axios = require("axios");

// Base URL
const BASE_URL = "http://localhost:5000/api/v1";

// You need valid IDs from your database for testing
const TEST_DATA = {
  districtId: "65a1234567890abcdef12345", // Replace with actual district ID
  marketId: "65a1234567890abcdef12346", // Replace with actual market ID
  commodityId: "65a1234567890abcdef12347", // Replace with actual commodity ID
  accessToken: "", // Will be set after login
};

// Color console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) =>
    console.log(
      `\n${colors.cyan}${"=".repeat(60)}\n${msg}\n${"=".repeat(60)}${colors.reset}\n`,
    ),
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
    };

    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Test 1: Login and get token
async function testLogin() {
  log.section("TEST 1: Login to Get Access Token");

  const result = await apiCall("post", "/auth/login", {
    mobileNumber: "9999999999",
    firebaseIdToken: "dummy-token-for-testing",
    role: "farmer",
  });

  if (result.success) {
    TEST_DATA.accessToken = result.data.data.tokens.accessToken;
    log.success("Login successful - Token received");
    log.info("Using token for subsequent requests");
  } else {
    log.error(`Login failed: ${JSON.stringify(result.error)}`);
    process.exit(1);
  }

  return result.success;
}

// Test 2: Create price alert (UP direction)
async function testCreateAlertUp() {
  log.section("TEST 2: Create Price Alert (Direction: UP)");

  const result = await apiCall(
    "post",
    "/alerts",
    {
      districtId: TEST_DATA.districtId,
      marketId: TEST_DATA.marketId,
      commodityId: TEST_DATA.commodityId,
      targetPrice: 3500,
      direction: "up", // Alert when price goes above 3500
    },
    TEST_DATA.accessToken,
  );

  if (result.success) {
    log.success("Alert created successfully (UP direction)");
    console.log("Alert ID:", result.data.data.alert._id);
    console.log("Target Price:", result.data.data.alert.targetPrice);
    console.log("Direction:", result.data.data.alert.direction);
    TEST_DATA.alertUpId = result.data.data.alert._id;
  } else {
    log.error(`Create alert failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 3: Create price alert (DOWN direction)
async function testCreateAlertDown() {
  log.section("TEST 3: Create Price Alert (Direction: DOWN)");

  const result = await apiCall(
    "post",
    "/alerts",
    {
      districtId: TEST_DATA.districtId,
      marketId: TEST_DATA.marketId,
      commodityId: TEST_DATA.commodityId,
      targetPrice: 3000,
      direction: "down", // Alert when price goes below 3000
    },
    TEST_DATA.accessToken,
  );

  if (result.success) {
    log.success("Alert created successfully (DOWN direction)");
    console.log("Alert ID:", result.data.data.alert._id);
    console.log("Target Price:", result.data.data.alert.targetPrice);
    console.log("Direction:", result.data.data.alert.direction);
    TEST_DATA.alertDownId = result.data.data.alert._id;
  } else {
    log.error(`Create alert failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 4: Get all user alerts
async function testGetAlerts() {
  log.section("TEST 4: Get All User Alerts");

  const result = await apiCall("get", "/alerts", null, TEST_DATA.accessToken);

  if (result.success) {
    log.success(`Found ${result.data.count} alert(s)`);
    result.data.data.alerts.forEach((alert, index) => {
      console.log(
        `\nAlert ${index + 1}: ${alert.direction.toUpperCase()} at ₹${alert.targetPrice}`,
      );
      console.log(`  Market: ${alert.market.name}`);
      console.log(`  Commodity: ${alert.commodity.name}`);
      console.log(`  Active: ${alert.isActive}`);
    });
  } else {
    log.error(`Get alerts failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 5: Get alert statistics
async function testGetStats() {
  log.section("TEST 5: Get Alert Statistics");

  const result = await apiCall(
    "get",
    "/alerts/stats",
    null,
    TEST_DATA.accessToken,
  );

  if (result.success) {
    log.success("Statistics fetched successfully");
    console.log("Total Alerts:", result.data.data.stats.total);
    console.log("Active:", result.data.data.stats.active);
    console.log("Inactive:", result.data.data.stats.inactive);
  } else {
    log.error(`Get stats failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 6: Update alert
async function testUpdateAlert() {
  log.section("TEST 6: Update Alert");

  if (!TEST_DATA.alertUpId) {
    log.warning("No alert ID available - skipping update test");
    return false;
  }

  const result = await apiCall(
    "put",
    `/alerts/${TEST_DATA.alertUpId}`,
    {
      targetPrice: 3800, // Update target price
      direction: "up", // Keep same direction
    },
    TEST_DATA.accessToken,
  );

  if (result.success) {
    log.success("Alert updated successfully");
    console.log("New Target Price:", result.data.data.alert.targetPrice);
    console.log("Direction:", result.data.data.alert.direction);
  } else {
    log.error(`Update alert failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 7: Toggle alert status
async function testToggleAlert() {
  log.section("TEST 7: Toggle Alert Status");

  if (!TEST_DATA.alertUpId) {
    log.warning("No alert ID available - skipping toggle test");
    return false;
  }

  const result = await apiCall(
    "post",
    `/alerts/${TEST_DATA.alertUpId}/toggle`,
    null,
    TEST_DATA.accessToken,
  );

  if (result.success) {
    log.success(
      `Alert ${result.data.data.alert.isActive ? "activated" : "deactivated"}`,
    );
    console.log("Active Status:", result.data.data.alert.isActive);
  } else {
    log.error(`Toggle alert failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 8: Delete alert
async function testDeleteAlert() {
  log.section("TEST 8: Delete Alert");

  if (!TEST_DATA.alertDownId) {
    log.warning("No alert ID available - skipping delete test");
    return false;
  }

  const result = await apiCall(
    "delete",
    `/alerts/${TEST_DATA.alertDownId}`,
    null,
    TEST_DATA.accessToken,
  );

  if (result.success) {
    log.success("Alert deleted successfully");
  } else {
    log.error(`Delete alert failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 9: Try to create alert with invalid direction
async function testInvalidDirection() {
  log.section("TEST 9: Test Invalid Direction (Should Fail)");

  const result = await apiCall(
    "post",
    "/alerts",
    {
      districtId: TEST_DATA.districtId,
      marketId: TEST_DATA.marketId,
      commodityId: TEST_DATA.commodityId,
      targetPrice: 3500,
      direction: "both", // Invalid - should fail
    },
    TEST_DATA.accessToken,
  );

  if (!result.success) {
    log.success("Correctly rejected invalid direction");
    console.log("Error message:", result.error.message);
  } else {
    log.error("Should have failed but succeeded!");
  }

  return !result.success; // Test passes if API call fails
}

// Run all tests
async function runAllTests() {
  console.log(
    `\n${colors.cyan}${"=".repeat(60)}\nPRICE ALERT API TESTS\n${"=".repeat(60)}${colors.reset}\n`,
  );

  log.warning("⚠️  Make sure to update TEST_DATA with valid IDs from your DB");
  log.info("ℹ  Server should be running on http://localhost:5000");
  console.log("");

  const tests = [
    testLogin,
    testCreateAlertUp,
    testCreateAlertDown,
    testGetAlerts,
    testGetStats,
    testUpdateAlert,
    testToggleAlert,
    testInvalidDirection,
    testDeleteAlert,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  // Summary
  log.section("TEST SUMMARY");
  console.log(`Total Tests: ${tests.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed === 0) {
    log.success("🎉 All tests passed!");
  } else {
    log.error(`❌ ${failed} test(s) failed`);
  }

  log.section("CLEANUP");
  log.info(
    "To remove test alerts from database, use MongoDB Compass or shell:",
  );
  log.info('  db.pricealerts.deleteMany({ user: ObjectId("...") })');
}

// Execute tests
runAllTests().catch((error) => {
  log.error(`Test execution failed: ${error.message}`);
  process.exit(1);
});
