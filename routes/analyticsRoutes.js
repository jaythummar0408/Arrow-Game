const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

/**
 * ========================================
 * MARKET ANALYTICS API ROUTES
 * Base: /api/v1/analytics
 * ========================================
 */

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

/**
 * @route   GET /api/v1/analytics/market/:marketId
 * @desc    Get comprehensive market analytics comparing live data with historical data
 * @param   marketId - MongoDB ObjectId of the market
 * @details Provides:
 *          - Price hikes (commodities with increased prices)
 *          - Price drops (commodities with decreased prices)
 *          - New commodities added today
 *          - Unchanged prices
 *          - Commodities not updated today
 *          - Single entry commodities
 *          - Highest and lowest priced commodities
 *          - Summary statistics
 * @access  Public
 */
router.get("/market/:marketId", analyticsController.getMarketAnalytics);

/**
 * @route   GET /api/v1/analytics/market/:marketId/commodity/:commodityId
 * @desc    Get detailed analytics for a specific commodity in a specific market
 * @param   marketId - MongoDB ObjectId of the market
 * @param   commodityId - MongoDB ObjectId of the commodity
 * @query   days - Period for analytics (7, 15, or 30 days, default: 30)
 * @details Provides:
 *          - Today's price (if updated)
 *          - Latest 3 prices (if not updated today)
 *          - Price history for charts (last N days)
 *          - Statistics (highest, lowest, average prices)
 *          - Trend analysis (recent trend, overall trend, volatility)
 *          - Price movement patterns
 * @example /api/v1/analytics/market/123abc/commodity/456def?days=7
 * @access  Public
 */
router.get(
  "/market/:marketId/commodity/:commodityId",
  analyticsController.getCommodityAnalytics,
);

/**
 * @route   GET /api/v1/analytics/compare
 * @desc    Compare commodity prices across two different markets
 * @query   commodityId - MongoDB ObjectId of the commodity (required)
 * @query   marketIdA - MongoDB ObjectId of first market (required)
 * @query   marketIdB - MongoDB ObjectId of second market (required)
 * @query   days - Period for comparison (7, 15, or 30 days, default: 7)
 * @details Provides:
 *          - Current prices in both markets
 *          - Price history for both markets
 *          - Statistics (min, max, avg for each market)
 *          - Trend comparison (up/down/stable)
 *          - Price difference and percentage
 *          - Which market is cheaper
 *          - Recommendation for buyers/sellers
 * @example /api/v1/analytics/compare?commodityId=123abc&marketIdA=456def&marketIdB=789ghi&days=7
 * @access  Public
 */
router.get("/compare", analyticsController.compareCommodityPrices);

/**
 * @route   GET /api/v1/analytics/markets
 * @desc    Get all markets list with state and district info
 * @query   state - Filter by state name (optional)
 * @query   district - Filter by district name (optional)
 * @access  Public
 */
router.get("/markets", analyticsController.getMarketsList);

module.exports = router;
