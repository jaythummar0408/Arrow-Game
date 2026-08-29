require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const { MarketPrice } = require("../models");

/**
 * Market-price retention.
 *
 * The app's analytics only ever query the last 7/15/30 days, so market prices
 * older than the retention window are unused. This deletes them to keep the
 * collection bounded. Deletion is recoverable — scripts/fastBackfill.js can
 * re-fetch any day from the gov API.
 *
 * Window is configurable via PRICE_RETENTION_DAYS (default 35 = the 30-day UI
 * window + a 5-day safety buffer so the 30D chart never loses its oldest day
 * mid-day).
 */
const DEFAULT_DAYS = parseInt(process.env.PRICE_RETENTION_DAYS, 10) || 35;

/** Cutoff = UTC midnight, `days` days before today. Rows strictly older are removed. */
const cutoffFor = (days) => {
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
};

/**
 * Delete (or, with dryRun, count) market prices older than the retention window.
 * Assumes the DB connection is already open (safe to call from the cron).
 * @returns {Promise<{days:number, cutoff:Date, matched:number, deleted:number, dryRun:boolean}>}
 */
async function purgeOldPrices(days = DEFAULT_DAYS, { dryRun = false } = {}) {
  const cutoff = cutoffFor(days);
  const filter = { arrival_date: { $lt: cutoff } };

  if (dryRun) {
    const matched = await MarketPrice.countDocuments(filter);
    return { days, cutoff, matched, deleted: 0, dryRun: true };
  }

  const res = await MarketPrice.deleteMany(filter);
  return { days, cutoff, matched: res.deletedCount || 0, deleted: res.deletedCount || 0, dryRun: false };
}

module.exports = { purgeOldPrices, DEFAULT_DAYS };

// ── CLI: node scripts/purgeOldPrices.js [days] [--dry-run] ───────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const daysArg = args.find((a) => /^\d+$/.test(a));
  const days = daysArg ? parseInt(daysArg, 10) : DEFAULT_DAYS;

  (async () => {
    await connectDB();
    const cutoff = cutoffFor(days);
    console.log(
      `\n🧹 Price retention: keep last ${days} day(s) — removing arrival_date < ${cutoff.toISOString().slice(0, 10)}`,
    );
    const result = await purgeOldPrices(days, { dryRun });
    if (dryRun) {
      console.log(`🔍 DRY RUN — ${result.matched} record(s) would be deleted (nothing removed).`);
    } else {
      console.log(`✅ Deleted ${result.deleted} record(s) older than ${days} days.`);
    }
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error("❌ Purge failed:", err.message);
    process.exit(1);
  });
}
