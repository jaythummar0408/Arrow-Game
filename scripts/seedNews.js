/**
 * Seeds the "Sarkari Yojana" (schemes) section from data/schemes.js.
 * English text is auto-translated to Gujarati and stored. Uses the same
 * upsert logic as the daily 6 AM job, so it is safe to re-run and never
 * creates duplicates.
 *
 *   node scripts/seedNews.js            # add / refresh schemes
 *   node scripts/seedNews.js --reset    # delete existing schemes first
 */
require("dotenv").config();
const connectDB = require("../config/database");
const { News } = require("../models");
const { ingestSchemes } = require("../controllers/newsController");

(async () => {
  try {
    await connectDB();
    if (process.argv.includes("--reset")) {
      const del = await News.deleteMany({ section: "yojana" });
      console.log(`🧹 Cleared ${del.deletedCount} existing scheme(s).`);
    }
    console.log("\n🎗️  Seeding Gujarat schemes + scheme news...\n");
    const r = await ingestSchemes();
    console.log(`   curated +${r.curatedCreated} new / ${r.curatedRefreshed} refreshed; scraped +${r.scraped} (fetched ${r.fetched})`);
    console.log("\n✨ Done seeding schemes.\n");
    process.exit(0);
  } catch (e) {
    console.error("Seed failed:", e.message);
    process.exit(1);
  }
})();
