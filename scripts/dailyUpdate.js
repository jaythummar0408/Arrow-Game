/**
 * Manual run of the DAILY job — the same thing the 6 AM IST cron does:
 *   1. Refresh news from NewsData.io (Gujarati translation)
 *   2. Refresh the Gujarat schemes (curated + scraped scheme news)
 *   3. Delete any news/scheme older than 7 days
 *   4. If new content was added, broadcast a push to users
 *
 * Runs directly against the DB (the API server does NOT need to be running).
 *
 *   node scripts/dailyUpdate.js
 */
require("dotenv").config();
const connectDB = require("../config/database");
const { runDailyUpdate } = require("../controllers/newsController");

(async () => {
  try {
    await connectDB();
    console.log("\n🌅 Daily update — news (NewsData.io) + Gujarat schemes\n");
    const { news, schemes, purge, broadcast } = await runDailyUpdate();
    console.log(`📰 News:    fetched ${news.fetched}, created ${news.created}, skipped ${news.skipped}`);
    console.log(`🎗️  Schemes: curated +${schemes.curatedCreated}/${schemes.curatedRefreshed}, scraped +${schemes.scraped}`);
    console.log(`🧹 Purged:  ${purge.deleted} item(s) older than 7 days`);
    console.log(`📣 Push:    sent to ${broadcast.sent}/${broadcast.users} users`);
    console.log("\n✨ Done.\n");
    process.exit(0);
  } catch (e) {
    console.error("Daily update failed:", e.message);
    process.exit(1);
  }
})();
