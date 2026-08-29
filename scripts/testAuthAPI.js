/**
 * Authentication API Test Script
 * Tests simplified auth flow: login (auto-creates users), token refresh, and profile management
 */

const axios = require("axios");

// Base URL
const BASE_URL = "http://localhost:5000/api/v1";

// Test user data
const testUser = {
  name: "Test Farmer",
  mobileNumber: "9999999999",
  role: "farmer",
};

// Test user 2 for existing user login
const testUser2 = {
  mobileNumber: "8888888888",
  name: "Existing Farmer",
  role: "farmer",
};

// Store tokens
let accessToken = "";
let refreshToken = "";
let userId = "";

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

// Test 1: Login (should auto-create new user)
async function testLoginNewUser() {
  log.section("TEST 1: Login with New User (Auto-creates account)");

  const result = await apiCall("post", "/auth/login", {
    mobileNumber: testUser.mobileNumber,
    role: testUser.role,
    firebaseIdToken: "dummy-token-for-testing", // In real app, this comes from Firebase
  });

  if (result.success) {
    log.success("Login successful - New user auto-created with default name");
    console.log("Is New User:", result.data.data.isNewUser);
    console.log("User ID:", result.data.data.user.id);
    console.log("Name:", result.data.data.user.name);
    console.log("Mobile:", result.data.data.user.mobileNumber);
    console.log("Role:", result.data.data.user.role);

    // Store tokens and user ID
    accessToken = result.data.data.tokens.accessToken;
    refreshToken = result.data.data.tokens.refreshToken;
    userId = result.data.data.user.id;

    log.info(
      "Access Token received (first 20 chars): " +
        accessToken.substring(0, 20) +
        "...",
    );
    log.info(
      "Refresh Token received (first 20 chars): " +
        refreshToken.substring(0, 20) +
        "...",
    );
  } else {
    log.error(`Login failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 2: Login with existing user
async function testLoginExistingUser() {
  log.section("TEST 2: Login with Existing User");

  const result = await apiCall("post", "/auth/login", {
    mobileNumber: testUser.mobileNumber,
    firebaseIdToken: "dummy-token-for-testing",
  });

  if (result.success) {
    log.success("Login successful - Existing user logged in");
    console.log("Is New User:", result.data.data.isNewUser);
    console.log("User ID:", result.data.data.user.id);
    console.log("Name:", result.data.data.user.name);

    // Update tokens with the new ones from this login
    accessToken = result.data.data.tokens.accessToken;
    refreshToken = result.data.data.tokens.refreshToken;

    if (result.data.data.isNewUser === false) {
      log.success("✓ Correctly identified as existing user");
    } else {
      log.warning("⚠ User should be identified as existing");
    }
  } else {
    log.error(`Login failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 3: Get Profile
async function testGetProfile() {
  log.section("TEST 3: Get User Profile");

  const result = await apiCall("get", "/auth/me", null, accessToken);

  if (result.success) {
    log.success("Profile fetched successfully");
    console.log(
      "User Profile:",
      JSON.stringify(result.data.data.user, null, 2),
    );
  } else {
    log.error(`Get profile failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 4: Update Profile
async function testUpdateProfile() {
  log.section("TEST 4: Update User Profile");

  const result = await apiCall(
    "put",
    "/auth/profile",
    {
      name: "Updated Test Farmer",
      preferredLanguage: "gu",
    },
    accessToken,
  );

  if (result.success) {
    log.success("Profile updated successfully");
    console.log("Updated User:", result.data.data.user);
  } else {
    log.error(`Update profile failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 5: Refresh Token
async function testRefreshToken() {
  log.section("TEST 5: Refresh Access Token");

  const result = await apiCall("post", "/auth/refresh-token", {
    refreshToken: refreshToken,
  });

  if (result.success) {
    log.success("Token refreshed successfully");
    console.log(
      "New Access Token:",
      result.data.data.accessToken.substring(0, 20) + "...",
    );
    console.log("Expires In:", result.data.data.accessTokenExpiresIn);

    // Update access token
    accessToken = result.data.data.accessToken;
  } else {
    log.error(`Token refresh failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 6: Invalid Token Access
async function testInvalidToken() {
  log.section("TEST 6: Access with Invalid Token (Should Fail)");

  const result = await apiCall("get", "/auth/me", null, "invalid_token_12345");

  if (!result.success && result.status === 401) {
    log.success("Invalid token correctly rejected");
    console.log("Error message:", result.error.message);
  } else {
    log.error("Invalid token should have been rejected!");
  }

  return !result.success;
}

// Test 7: Invalid Refresh Token
async function testInvalidRefreshToken() {
  log.section("TEST 7: Refresh with Invalid Token (Should Fail)");

  const result = await apiCall("post", "/auth/refresh-token", {
    refreshToken: "invalid_refresh_token_12345",
  });

  if (!result.success && result.status === 401) {
    log.success("Invalid refresh token correctly rejected");
    console.log("Error message:", result.error.message);
  } else {
    log.error("Invalid refresh token should have been rejected!");
  }

  return !result.success;
}

// Test 8: Access Without Token
async function testNoToken() {
  log.section("TEST 8: Access Protected Route Without Token (Should Fail)");

  const result = await apiCall("get", "/auth/me");

  if (!result.success && result.status === 401) {
    log.success("Access without token correctly rejected");
    console.log("Error message:", result.error.message);
  } else {
    log.error("Access without token should have been rejected!");
  }

  return !result.success;
}

// Test 9: Logout
async function testLogout() {
  log.section("TEST 9: User Logout");

  const result = await apiCall("post", "/auth/logout", null, accessToken);

  if (result.success) {
    log.success("Logout successful");
    console.log("Message:", result.data.message);
  } else {
    log.error(`Logout failed: ${JSON.stringify(result.error)}`);
  }

  return result.success;
}

// Test 10: Use Refresh Token After Logout (should fail)
async function testRefreshAfterLogout() {
  log.section("TEST 10: Refresh Token After Logout (Should Fail)");

  const result = await apiCall("post", "/auth/refresh-token", {
    refreshToken: refreshToken,
  });

  if (!result.success && result.status === 401) {
    log.success("Refresh token correctly invalidated after logout");
    console.log("Error message:", result.error.message);
  } else {
    log.error("Refresh token should have been invalidated after logout!");
  }

  return !result.success;
}

// Main test runner
async function runTests() {
  log.section("APMC KHETIVADI - AUTHENTICATION API TESTS");
  log.info("Make sure the server is running on http://localhost:5000");
  log.warning("This test will create a test user in the database");

  const tests = [
    { name: "Login New User (Auto-create)", fn: testLoginNewUser },
    { name: "Login Existing User", fn: testLoginExistingUser },
    { name: "Get Profile", fn: testGetProfile },
    { name: "Update Profile", fn: testUpdateProfile },
    { name: "Refresh Token", fn: testRefreshToken },
    { name: "Invalid Token", fn: testInvalidToken },
    { name: "Invalid Refresh Token", fn: testInvalidRefreshToken },
    { name: "No Token", fn: testNoToken },
    { name: "Logout", fn: testLogout },
    { name: "Refresh After Logout", fn: testRefreshAfterLogout },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log.error(`Test "${test.name}" threw an error: ${error.message}`);
      failed++;
    }
  }

  // Summary
  log.section("TEST SUMMARY");
  console.log(`Total Tests: ${tests.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed === 0) {
    log.success("\n🎉 All tests passed!");
  } else {
    log.error(`\n❌ ${failed} test(s) failed`);
  }

  // Cleanup instructions
  log.section("CLEANUP");
  log.info("To remove test user from database, run:");
  log.info(
    `  MongoDB Shell: db.users.deleteOne({ mobileNumber: "${testUser.mobileNumber}" })`,
  );
  log.info(`  OR use MongoDB Compass to delete the user`);
}

// Run tests
runTests().catch((error) => {
  log.error(`Test runner failed: ${error.message}`);
  process.exit(1);
});
