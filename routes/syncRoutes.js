const express = require("express");
const router = express.Router();
const syncController = require("../controllers/syncController");

/**
 * ========================================
 * DATA SYNCHRONIZATION API ROUTES
 * Base: /api/v1/sync
 * ========================================
 */

// ============================================
// DATA SYNC ENDPOINTS
// ============================================

/**
 * @route   POST /api/v1/sync/hourly
 * @desc    Sync today's market price data for Gujarat (Hourly Sync)
 * @note    Fetches data from Daily API without commodity_code
 * @access  Public
 */
router.post("/hourly", syncController.syncHourlyData);

/**
 * @route   POST /api/v1/sync/yesterday
 * @desc    Sync yesterday's market price data for Gujarat (Nightly Sync with Backfill)
 * @note    Fetches data from Historical API with commodity_code and backfills missing codes
 * @body    { state: "Gujarat" } (optional, defaults to Gujarat)
 * @access  Public
 */
router.post("/yesterday", syncController.syncYesterdayData);

/**
 * @route   POST /api/v1/sync/date
 * @desc    Sync market price data for a specific date
 * @body    { date: "DD-MM-YYYY", state: "Gujarat" }
 * @access  Public
 */
router.post("/date", syncController.syncSpecificDate);

// ============================================
// SYNC STATUS ENDPOINTS
// ============================================

/**
 * @route   GET /api/v1/sync/status
 * @desc    Get sync status and database statistics (total records, entities count)
 * @access  Public
 */
router.get("/status", syncController.getSyncStatus);

module.exports = router;
