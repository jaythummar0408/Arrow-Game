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
const DEFAULT_DAYS = parseInt(process.env.NEWS_RETENTION_DAYS, 10) || 7;

async function purgeOldNews(days = DEFAULT_DAYS, { dryRun = false } = {}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filter = {
    publishedAt: { $lt: cutoff },
    externalId: { $not: /^scheme:/ },
  };
  if (dryRun) {
    return { days, cutoff, matched: await News.countDocuments(filter), deleted: 0, dryRun: true };
  }
  const res = await News.deleteMany(filter);
  return { days, cutoff, matched: res.deletedCount || 0, deleted: res.deletedCount || 0, dryRun: false };
}

module.exports = { purgeOldNews, DEFAULT_DAYS };

// ── CLI: node scripts/purgeOldNews.js [days] [--dry-run] ─────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const daysArg = args.find((a) => /^\d+$/.test(a));
  const days = daysArg ? parseInt(daysArg, 10) : DEFAULT_DAYS;

  (async () => {
    await connectDB();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    console.log(
      `\n🧹 News retention: keep last ${days} day(s) — removing publishedAt < ${cutoff
        .toISOString()
        .slice(0, 10)} (curated schemes kept)`,
    );
    const r = await purgeOldNews(days, { dryRun });
    console.log(
      dryRun
        ? `🔍 DRY RUN — ${r.matched} item(s) would be deleted (nothing removed).`
        : `✅ Deleted ${r.deleted} item(s) older than ${days} days.`,
    );
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error("❌ News purge failed:", err.message);
    process.exit(1);
  });
}
