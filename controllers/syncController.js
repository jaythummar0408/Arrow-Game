const { fetchDailyPrices, fetchPastDayPrices } = require("../utils/dataGovApi");
const {
  processPriceRecordsBatch,
  processDailyPriceRecordsBatch,
  backfillCommodityCodes,
} = require("../utils/dataProcessor");

/**
 * Get today's date in DD-MM-YYYY format
 * @returns {string} Today's date
 */
const getTodayDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Get yesterday's date in DD-MM-YYYY format
 * @returns {string} Yesterday's date
 */
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const day = String(yesterday.getDate()).padStart(2, "0");
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const year = yesterday.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Sync today's price data for Gujarat state (Hourly Sync)
 * This function fetches today's data from Daily API (without commodity_code)
 * and stores it in the database. Commodity codes will be backfilled during nightly sync.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.syncHourlyData = async (req, res) => {
  try {
    const todayDate = getTodayDate();

    console.log(`\n🕐 Hourly Sync - Fetching today's data: ${todayDate}\n`);

    // Fetch data from Data.gov.in Daily API (Source B - without commodity_code)
    const apiResult = await fetchDailyPrices(
      {
        state: "Gujarat",
      },
      1500,
    );

    if (!apiResult.success) {
      console.error(`❌ API fetch failed: ${apiResult.error}`);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch data from Daily API",
        error: apiResult.error,
      });
    }

    const records = apiResult.data.records;

    if (!records || records.length === 0) {
      console.log("⚠️  No records found for today");
      return res.json({
        success: true,
        message: "No records found for today",
        date: todayDate,
        count: 0,
      });
    }

    console.log(`📥 Fetched ${records.length} records from Daily API`);
    console.log(
      `📊 Processing records (commodity codes will be backfilled tonight)...\n`,
    );

    // Process all records using daily processor (handles null commodity_code)
    const results = await processDailyPriceRecordsBatch(records);

    console.log(`\n✅ Hourly sync completed!`);
    console.log(`   Created: ${results.created}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Errors: ${results.errors}`);

    // Determine overall success status
    const hasPartialSuccess = results.created > 0 || results.updated > 0;
    const statusCode = results.errors > 0 && !hasPartialSuccess ? 500 : 200;

    return res.status(statusCode).json({
      success: results.errors === 0 || hasPartialSuccess,
      message:
        results.errors === 0
          ? "Today's data synced successfully"
          : `Sync completed with ${results.errors} error(s)`,
      syncType: "hourly",
      date: todayDate,
      state: "Gujarat",
      summary: {
        total: results.total,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      },
      note: "Commodity codes will be backfilled during nightly sync",
      errorDetails:
        results.errorDetails.length > 0 ? results.errorDetails : undefined,
    });
  } catch (error) {
    console.error("❌ Error in hourly sync:", error.message);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error syncing hourly data",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Sync yesterday's price data for Gujarat state (Nightly Sync with Backfill)
 * This function fetches yesterday's data from Historical API (with commodity_code)
 * and also backfills missing commodity codes for existing commodities.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.syncYesterdayData = async (req, res) => {
  try {
    const yesterdayDate = getYesterdayDate();

    console.log(
      `\n🌙 Nightly Sync - Fetching yesterday's data: ${yesterdayDate}\n`,
    );

    // Fetch data from Data.gov.in API
    const apiResult = await fetchPastDayPrices(
      {
        state: "Gujarat",
        arrivalDate: yesterdayDate,
      },
      3000,
    );

    if (!apiResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch data from API",
        error: apiResult.error,
      });
    }

    const records = apiResult.data.records;

    if (!records || records.length === 0) {
      return res.json({
        success: true,
        message: "No records found for yesterday",
        date: yesterdayDate,
        count: 0,
      });
    }

    console.log(`📥 Fetched ${records.length} records from API`);
    console.log(`📊 Processing records...\n`);

    // Process all records (with commodity_code from Historical API)
    const results = await processPriceRecordsBatch(records);

    console.log(`\n✅ Yesterday's data processing completed!`);
    console.log(`   Created: ${results.created}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Errors: ${results.errors}`);

    // Step 2: Backfill commodity codes for existing commodities
    console.log(`\n🔄 Starting commodity code backfill...`);
    const backfillResults = await backfillCommodityCodes(records);

    return res.json({
      success: true,
      message: "Data synced and commodity codes backfilled successfully",
      syncType: "nightly",
      date: yesterdayDate,
      state: "Gujarat",
      summary: {
        total: results.total,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      },
      backfillSummary: {
        total: backfillResults.total,
        updated: backfillResults.updated,
        skipped: backfillResults.skipped,
        errors: backfillResults.errors,
      },
      errorDetails:
        results.errorDetails.length > 0 ? results.errorDetails : undefined,
      backfillErrors:
        backfillResults.errorDetails.length > 0
          ? backfillResults.errorDetails
          : undefined,
    });
  } catch (error) {
    console.error("❌ Error syncing data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error syncing data",
      error: error.message,
    });
  }
};

/**
 * Sync data for a specific date (with commodity code backfill)
 * This function fetches data from Historical API (with commodity_code)
 * and also backfills missing commodity codes for existing commodities.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.syncSpecificDate = async (req, res) => {
  try {
    const { date, state = "Gujarat" } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required (format: DD-MM-YYYY)",
      });
    }

    console.log(`\n🔄 Syncing data for ${state} - ${date}\n`);

    // Fetch data from Data.gov.in Historical API (with commodity_code)
    const apiResult = await fetchPastDayPrices(
      {
        state,
        arrivalDate: date,
      },
      3000,
    );

    if (!apiResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch data from API",
        error: apiResult.error,
      });
    }

    const records = apiResult.data.records;

    if (!records || records.length === 0) {
      return res.json({
        success: true,
        message: "No records found for the specified date",
        date,
        state,
        count: 0,
      });
    }

    console.log(`📥 Fetched ${records.length} records from API`);
    console.log(`📊 Processing records...\n`);

    // Process all records (with commodity_code from Historical API)
    const results = await processPriceRecordsBatch(records);

    console.log(`\n✅ Processing completed!`);
    console.log(`   Created: ${results.created}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Errors: ${results.errors}`);

    // Step 2: Backfill commodity codes for existing commodities
    console.log(`\n🔄 Starting commodity code backfill...`);
    const backfillResults = await backfillCommodityCodes(records);

    return res.json({
      success: true,
      message: "Data synced and commodity codes backfilled successfully",
      date,
      state,
      summary: {
        total: results.total,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      },
      backfillSummary: {
        total: backfillResults.total,
        updated: backfillResults.updated,
        skipped: backfillResults.skipped,
        errors: backfillResults.errors,
      },
      errorDetails:
        results.errorDetails.length > 0 ? results.errorDetails : undefined,
      backfillErrors:
        backfillResults.errorDetails.length > 0
          ? backfillResults.errorDetails
          : undefined,
    });
  } catch (error) {
    console.error("❌ Error syncing data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error syncing data",
      error: error.message,
    });
  }
};

/**
 * Get sync status and statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSyncStatus = async (req, res) => {
  try {
    const {
      State,
      District,
      Market,
      Commodity,
      Variety,
      Grade,
      MarketPrice,
    } = require("../models");

    const stats = {
      states: await State.countDocuments(),
      districts: await District.countDocuments(),
      markets: await Market.countDocuments(),
      commodities: await Commodity.countDocuments(),
      varieties: await Variety.countDocuments(),
      grades: await Grade.countDocuments(),
      priceRecords: await MarketPrice.countDocuments(),
    };

    // Get latest price record date
    const latestRecord = await MarketPrice.findOne()
      .sort({ arrival_date: -1 })
      .select("arrival_date");

    return res.json({
      success: true,
      statistics: stats,
      latestDataDate: latestRecord?.arrival_date || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching sync status",
      error: error.message,
    });
  }
};
