const express = require("express");
const router = express.Router();
const marketPriceController = require("../controllers/marketPriceController");

/**
 * ========================================
 * MARKET PRICES API ROUTES
 * Base: /api/v1/market-prices
 * ========================================
 */

// ============================================
// MAIN QUERY ENDPOINTS
// ============================================

/**
 * @route   GET /api/v1/market-prices
 * @desc    Get market prices with advanced filtering and sorting
 * @query   days, startDate, endDate, state, district, market, commodity, commodityCode, variety, grade, minPrice, maxPrice, sortBy, sortOrder, page, limit, populate
 * @access  Public
 */
router.get("/", marketPriceController.getMarketPrices);

/**
 * @route   GET /api/v1/market-prices/stats
 * @desc    Get aggregated statistics (total records, avg prices, top commodities, top markets)
 * @query   days, state, commodity
 * @access  Public
 */
router.get("/stats", marketPriceController.getMarketPriceStats);

// ============================================
// FILTER & REFERENCE DATA ENDPOINTS
// ============================================

/**
 * @route   GET /api/v1/market-prices/filters
 * @desc    Get all available filter options (states, commodities, varieties, grades)
 * @access  Public
 */
router.get("/filters", marketPriceController.getFilterOptions);

// ============================================
// LOCATION HIERARCHY ENDPOINTS
// ============================================

/**
 * @route   GET /api/v1/market-prices/locations/states
 * @desc    Get all states
 * @access  Public
 */
router.get("/locations/states", marketPriceController.getFilterOptions); // Uses same controller, returns states

/**
 * @route   GET /api/v1/market-prices/locations/districts/:state
 * @desc    Get all districts in a state
 * @param   state - State name (e.g., Gujarat)
 * @access  Public
 */
router.get(
  "/locations/districts/:state",
  marketPriceController.getDistrictsByState,
);

/**
 * @route   GET /api/v1/market-prices/locations/markets/:district
 * @desc    Get all markets in a district
 * @param   district - District name (e.g., Ahmedabad)
 * @access  Public
 */
router.get(
  "/locations/markets/:districtId",
  marketPriceController.getMarketsByDistrict,
);

// ============================================
// COMMODITY REFERENCE ENDPOINTS
// ============================================

/**
 * @route   GET /api/v1/market-prices/commodities
 * @desc    Get all commodities with codes
 * @access  Public
 */
router.get("/commodities", marketPriceController.getFilterOptions); // Uses same controller, returns commodities

/**
 * @route   GET /api/v1/market-prices/varieties
 * @desc    Get all varieties
 * @access  Public
 */
router.get("/varieties", marketPriceController.getFilterOptions); // Uses same controller, returns varieties

/**
 * @route   GET /api/v1/market-prices/grades
 * @desc    Get all grades
 * @access  Public
 */
router.get("/grades", marketPriceController.getFilterOptions); // Uses same controller, returns grades

module.exports = router;
