/**
 * Central Route Index
 * All API routes are exported from here for clean server.js integration
 */

const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const syncRoutes = require("./syncRoutes");
const marketPriceRoutes = require("./marketPriceRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const alertRoutes = require("./alertRoutes");
const khataRoutes = require("./khataRoutes");
const tractorRoutes = require("./tractorRoutes");
const newsRoutes = require("./newsRoutes");
const notificationRoutes = require("./notificationRoutes");

/**
 * API Routes Structure:
 *
 * /api/v1
 *   ├── /auth              - Authentication endpoints (signup, login, token refresh)
 *   ├── /sync              - Data synchronization endpoints
 *   ├── /market-prices     - Market price query endpoints
 *   ├── /analytics         - Market analytics endpoints
 *   └── /alerts            - Price alert management endpoints
 */

// Mount route modules
router.use("/auth", authRoutes);
router.use("/sync", syncRoutes);
router.use("/market-prices", marketPriceRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/alerts", alertRoutes);
router.use("/khata", khataRoutes);
router.use("/tractor", tractorRoutes);
router.use("/news", newsRoutes);
router.use("/notifications", notificationRoutes);

// API Documentation Route
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "APMC Khetivadi API v1",
    version: "1.0.0",
    endpoints: {
      auth: {
        base: "/api/v1/auth",
        routes: [
          {
            method: "POST",
            path: "/signup",
            description: "Register a new user with mobile number",
            body: {
              name: "string",
              mobileNumber: "string",
              firebaseIdToken: "string",
              role: "farmer|trader|admin",
            },
          },
          {
            method: "POST",
            path: "/login",
            description: "Login with mobile number and Firebase token",
            body: { mobileNumber: "string", firebaseIdToken: "string" },
          },
          {
            method: "POST",
            path: "/refresh-token",
            description: "Refresh access token using refresh token",
            body: { refreshToken: "string" },
          },
          {
            method: "POST",
            path: "/logout",
            description: "Logout user (requires auth)",
            auth: "Bearer token",
          },
          {
            method: "GET",
            path: "/me",
            description: "Get current user profile (requires auth)",
            auth: "Bearer token",
          },
          {
            method: "PUT",
            path: "/profile",
            description: "Update user profile (requires auth)",
            auth: "Bearer token",
            body: {
              name: "string",
              district: "ObjectId",
              market: "ObjectId",
              preferredLanguage: "en|gu|hi",
            },
          },
          {
            method: "POST",
            path: "/verify-phone",
            description: "Verify phone number (requires auth)",
            auth: "Bearer token",
            body: { firebaseIdToken: "string" },
          },
        ],
      },
      sync: {
        base: "/api/v1/sync",
        routes: [
          {
            method: "POST",
            path: "/yesterday",
            description: "Sync yesterday's market price data",
          },
          {
            method: "POST",
            path: "/date",
            description: "Sync specific date data",
            body: { date: "DD-MM-YYYY", state: "Gujarat" },
          },
          {
            method: "GET",
            path: "/status",
            description: "Get sync status and database statistics",
          },
        ],
      },
      marketPrices: {
        base: "/api/v1/market-prices",
        routes: [
          {
            method: "GET",
            path: "/",
            description: "Query market prices with advanced filters",
            params: [
              "days",
              "startDate",
              "endDate",
              "state",
              "district",
              "market",
              "commodity",
              "commodityCode",
              "variety",
              "grade",
              "minPrice",
              "maxPrice",
              "sortBy",
              "sortOrder",
              "page",
              "limit",
              "populate",
            ],
          },
          {
            method: "GET",
            path: "/stats",
            description: "Get aggregated statistics",
            params: ["days", "state", "commodity"],
          },
          {
            method: "GET",
            path: "/filters",
            description: "Get all available filter options",
          },
          {
            method: "GET",
            path: "/locations/states",
            description: "Get all states",
          },
          {
            method: "GET",
            path: "/locations/districts/:state",
            description: "Get districts by state",
          },
          {
            method: "GET",
            path: "/locations/markets/:district",
            description: "Get markets by district",
          },
          {
            method: "GET",
            path: "/commodities",
            description: "Get all commodities",
          },
          {
            method: "GET",
            path: "/varieties",
            description: "Get all varieties",
          },
          {
            method: "GET",
            path: "/grades",
            description: "Get all grades",
          },
        ],
      },
      analytics: {
        base: "/api/v1/analytics",
        routes: [
          {
            method: "GET",
            path: "/market/:marketId",
            description:
              "Get comprehensive market analytics (live vs historical)",
            details: [
              "Price hikes and drops",
              "New commodities added today",
              "Commodities not updated today",
              "Highest/lowest prices",
              "Single entry commodities",
              "Summary statistics",
            ],
          },
          {
            method: "GET",
            path: "/markets",
            description: "Get all markets list",
            params: ["state", "district"],
          },
        ],
      },
    },
    documentation: {
      masterAPI: "/docs/MASTER_API_GUIDE.md",
      syncAPI: "/docs/SYNC_API_GUIDE.md",
      deployment: "/docs/DEPLOYMENT_GUIDE.md",
    },
  });
});

module.exports = router;
