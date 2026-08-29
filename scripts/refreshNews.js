/**
 * Fetches the latest agriculture / farmer news, translates each item to
 * Hindi & Gujarati, and stores it in the "samachar" (Khedut Samachar) section.
 *
 * Runs directly against the DB — the API server does NOT need to be running.
 *
 *   node scripts/refreshNews.js            # add new items
 *   node scripts/refreshNews.js --reset    # delete existing samachar first, then refresh
 *
 * Uses NewsData.io when NEWSDATA_API_KEY is set in .env (real article
 * summaries); otherwise free Google News RSS. Force Google with NEWS_SOURCE=google.
 * Needs internet (news source + translation). De-dups by url.
 */
require("dotenv").config();
const connectDB = require("../config/database");
const { News } = require("../models");
const { localizeToAll } = require("../utils/translate");
const { fetchAgriNews } = require("../utils/newsFetcher");

const RESET = process.argv.includes("--reset");
const MAX_ITEMS = 5; // keep only the latest 5 news items

(async () => {
  try {
    await connectDB();

    if (RESET) {
      const del = await News.deleteMany({ section: "samachar" });
      console.log(`🧹 Cleared ${del.deletedCount} existing news item(s).`);
    }

    console.log("\n📰 Fetching latest agriculture news...");
    const raw = await fetchAgriNews();

    if (raw.length === 0) {
      console.log(
        "   ⚠️  No agriculture news found. Check internet, or try again later.\n",
      );
      process.exit(0);
    }

    let created = 0;
    let skipped = 0;

    for (const item of raw.slice(0, MAX_ITEMS)) {
      const exists = await News.findOne({ externalId: item.externalId }).lean();
      if (exists) {
        skipped++;
        continue;
      }
      console.log(`   ⚙️  ${item.title.slice(0, 65)}...`);
      const [title, summary, body] = [
        await localizeToAll(item.title),
        await localizeToAll(item.summary),
        await localizeToAll(item.body),
      ];
      await News.create({
        section: "samachar",
        category: "general",
        source: item.source,
        url: item.url,
        publishedAt: item.publishedAt,
        externalId: item.externalId,
        title,
        summary,
        body,
      });
      created++;
    }

    console.log(`\n✅ Done — created: ${created}, skipped (already existed): ${skipped}\n`);
    process.exit(0);
  } catch (e) {
    console.error("\n❌ Refresh failed:", e.message, "\n");
    process.exit(1);
  }
})();
