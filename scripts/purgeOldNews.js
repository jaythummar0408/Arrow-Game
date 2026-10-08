require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const { News } = require("../models");

/**
 * News retention: keep only the last N days of scraped news/scheme items.
 * Curated evergreen schemes (externalId "scheme:*") are always kept — they're
 * long-lived and refreshed by the daily job, and keep the Yojana tab populated.
 *
 * Window is configurable via NEWS_RETENTION_DAYS (default 7). Runs automatically
 * inside the daily news job (runDailyUpdate) and after every refreshNews; this
 * script is for one-off cleanup or a dedicated schedule.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
// Farmer news (samachar): 7 days. Schemes (yojana): 30 days.
const NEWS_DAYS = parseInt(process.env.NEWS_RETENTION_DAYS, 10) || 7;
const SCHEME_DAYS = parseInt(process.env.SCHEME_RETENTION_DAYS, 10) || 30;
const DEFAULT_DAYS = NEWS_DAYS; // kept for the CLI label / back-compat

async function purgeOldNews(_days, { dryRun = false } = {}) {
  const newsCutoff = new Date(Date.now() - NEWS_DAYS * DAY_MS);
  const schemeCutoff = new Date(Date.now() - SCHEME_DAYS * DAY_MS);
  // Curated evergreen schemes ("scheme:*") are always kept.
  const filter = {
    externalId: { $not: /^scheme:/ },
    $or: [
      { section: "samachar", publishedAt: { $lt: newsCutoff } },
      { section: "yojana", publishedAt: { $lt: schemeCutoff } },
    ],
  };
  if (dryRun) {
    return { newsCutoff, schemeCutoff, matched: await News.countDocuments(filter), deleted: 0, dryRun: true };
  }
  const res = await News.deleteMany(filter);
  return { newsCutoff, schemeCutoff, matched: res.deletedCount || 0, deleted: res.deletedCount || 0, dryRun: false };
}

module.exports = { purgeOldNews, DEFAULT_DAYS, NEWS_DAYS, SCHEME_DAYS };

// ── CLI: node scripts/purgeOldNews.js [--dry-run] ────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  (async () => {
    await connectDB();
    console.log(
      `\n🧹 News retention: samachar ${NEWS_DAYS}d, yojana ${SCHEME_DAYS}d (curated schemes kept)`,
    );
    const r = await purgeOldNews(undefined, { dryRun });
    console.log(
      dryRun
        ? `🔍 DRY RUN — ${r.matched} item(s) would be deleted (nothing removed).`
        : `✅ Deleted ${r.deleted} item(s) past their retention window.`,
    );
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error("❌ News purge failed:", err.message);
    process.exit(1);
  });
}
