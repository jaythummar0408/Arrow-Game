/**
 * ========================================
 * CRON JOBS CONFIGURATION
 * ========================================
 *
 * This file sets up automated scheduled tasks for data synchronization:
 *
 * 1. Hourly Sync (Every hour)
 *    - Fetches today's data from Daily API
 *    - Updates database with latest prices
 *    - Runs without commodity_code (will be backfilled)
 *
 * 2. Nightly Sync (12:30 AM)
 *    - Fetches yesterday's data from Historical API
 *    - Includes commodity_code
 *    - Backfills missing commodity codes
 */

const cron = require("node-cron");
const axios = require("axios");

// Get API base URL from environment or use default
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * Hourly Sync Job
 * Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
 * Fetches today's data and stores in database
 */
const setupHourlySync = () => {
  // Run every hour at minute 0
  // Cron format: minute hour day month weekday
  // '0 * * * *' means: at minute 0 of every hour
  cron.schedule("0 * * * *", async () => {
    const now = new Date();
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🕐 HOURLY SYNC STARTED: ${now.toISOString()}`);
    console.log(`${"=".repeat(60)}`);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/sync/hourly`,
        {},
        {
          timeout: 300000, // 5 minutes timeout
        },
      );

      if (response.data.success) {
        console.log("✅ Hourly sync completed successfully!");
        console.log(`   Created: ${response.data.summary.created}`);
        console.log(`   Updated: ${response.data.summary.updated}`);
        console.log(`   Total: ${response.data.summary.total}`);
      } else {
        console.error("❌ Hourly sync failed:", response.data.message);
      }
    } catch (error) {
      console.error("❌ Hourly sync error:", error.message);
      if (error.response) {
        console.error("   API Response:", error.response.data);
      }
    }

    console.log(`${"=".repeat(60)}\n`);
  });

  console.log("✅ Hourly sync job scheduled (runs every hour at minute 0)");
};

/**
 * Nightly Sync Job
 * Runs once per day at 12:30 AM
 * Fetches yesterday's data with commodity_code and backfills
 */
const setupNightlySync = () => {
  // Run at 12:30 AM every day
  // '30 0 * * *' means: at 12:30 AM every day
  cron.schedule("30 0 * * *", async () => {
    const now = new Date();
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🌙 NIGHTLY SYNC STARTED: ${now.toISOString()}`);
    console.log(`${"=".repeat(60)}`);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/sync/yesterday`,
        {},
        {
          timeout: 600000, // 5 minutes timeout
        },
      );

      if (response.data.success) {
        console.log("✅ Nightly sync completed successfully!");
        console.log("\n📊 Data Processing:");
        console.log(`   Created: ${response.data.summary.created}`);
        console.log(`   Updated: ${response.data.summary.updated}`);
        console.log(`   Total: ${response.data.summary.total}`);

        if (response.data.backfillSummary) {
          console.log("\n🔄 Commodity Code Backfill:");
          console.log(`   Updated: ${response.data.backfillSummary.updated}`);
          console.log(`   Skipped: ${response.data.backfillSummary.skipped}`);
          console.log(`   Total: ${response.data.backfillSummary.total}`);
        }
      } else {
        console.error("❌ Nightly sync failed:", response.data.message);
      }
    } catch (error) {
      console.error("❌ Nightly sync error:", error.message);
      if (error.response) {
        console.error("   API Response:", error.response.data);
      }
    }

    console.log(`${"=".repeat(60)}\n`);
  });

  console.log("✅ Nightly sync job scheduled (runs at 12:30 AM every day)");
};

/**
 * Daily News + Scheme Update Job
 * Runs at 6:00 AM IST every day: refreshes the latest agriculture news
 * (NewsData.io, up to 5) and the Gujarat schemes (up to 5), translates new
 * items to Gujarati, then deletes anything older than 7 days.
 */
const setupDailyUpdate = () => {
  cron.schedule(
    "0 6 * * *",
    async () => {
      console.log(`\n🌅 DAILY NEWS/SCHEME UPDATE STARTED: ${new Date().toISOString()}`);
      try {
        const { runDailyUpdate } = require("../controllers/newsController");
        const { news, schemes, purge, broadcast } = await runDailyUpdate();
        console.log(
          `✅ Daily update done — news +${news.created}/${news.fetched}, ` +
            `schemes curated +${schemes.curatedCreated}/${schemes.curatedRefreshed} scraped +${schemes.scraped}, ` +
            `purged ${purge.deleted} old, broadcast ${broadcast.sent}/${broadcast.users}.`,
        );
      } catch (error) {
        console.error("❌ Daily update error:", error.message);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("✅ Daily news/scheme update scheduled (6:00 AM IST)");
};

/**
 * Price Retention Job
 * Runs at 2:00 AM IST every day (after the nightly sync): deletes market prices
 * older than PRICE_RETENTION_DAYS (default 35). The app only queries the last
 * 7/15/30 days, so older rows are unused; deletion is recoverable via
 * scripts/fastBackfill.js.
 */
const setupPriceRetention = () => {
  cron.schedule(
    "0 2 * * *",
    async () => {
      console.log(`\n🧹 PRICE RETENTION STARTED: ${new Date().toISOString()}`);
      try {
        const { purgeOldPrices } = require("../scripts/purgeOldPrices");
        const { days, cutoff, deleted } = await purgeOldPrices();
        console.log(
          `✅ Price retention done — deleted ${deleted} record(s) older than ${days} days (before ${cutoff
            .toISOString()
            .slice(0, 10)}).`,
        );
      } catch (error) {
        console.error("❌ Price retention error:", error.message);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  console.log("✅ Price retention scheduled (2:00 AM IST, keeps last 35 days)");
};

/**
 * Initialize all cron jobs
 * Call this function from server.js after server starts
 */
const initializeCronJobs = () => {
  console.log("\n📅 Initializing Cron Jobs...\n");

  setupHourlySync();
  setupNightlySync();
  setupDailyUpdate();
  setupPriceRetention();

  console.log("\n✅ All cron jobs initialized successfully!\n");

  // Log next execution times
  console.log("📋 Schedule Summary:");
  console.log(
    "   • Hourly Sync: Every hour at minute 0 (1:00, 2:00, 3:00, etc.)",
  );
  console.log("   • Nightly Sync: Every day at 12:30 AM");
  console.log("   • News + Schemes: Every day at 6:00 AM IST (keeps last 7 days)");
  console.log("   • Price Retention: Every day at 2:00 AM IST (keeps last 35 days)");
  console.log("");
};

/**
 * Manual trigger functions (for testing)
 */
const triggerHourlySyncNow = async () => {
  console.log("\n🔧 Manually triggering hourly sync...\n");
  try {
    const response = await axios.post(`${API_BASE_URL}/sync/hourly`);
    console.log("Response:", response.data);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

const triggerNightlySyncNow = async () => {
  console.log("\n🔧 Manually triggering nightly sync...\n");
  try {
    const response = await axios.post(`${API_BASE_URL}/sync/yesterday`);
    console.log("Response:", response.data);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

module.exports = {
  initializeCronJobs,
  triggerHourlySyncNow,
  triggerNightlySyncNow,
};
