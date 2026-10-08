const { News, User } = require("../models");
const { localizeToAll } = require("../utils/translate");
const { fetchAgriNews, fetchSchemeNews } = require("../utils/newsFetcher");
const { sendGenericNotification } = require("../utils/firebaseNotification");
const { createNotification } = require("./notificationController");
const SCHEMES = require("../data/schemes");

const DAY_MS = 24 * 60 * 60 * 1000;
const NEWS_RETENTION_DAYS = 7; // samachar (farmer news): last 7 days
const SCHEME_RETENTION_DAYS = 30; // yojana (schemes): last 30 days

/** Ensure a localized field always has every language (fallback to en). */
const loc = (l) => {
  const en = (l && l.en) || "";
  return { en, hi: (l && l.hi) || en, gu: (l && l.gu) || en };
};

const slug = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/** Translate + store one fetched article into a section (skips if it exists). */
async function storeArticle(item, section, category) {
  const exists = await News.findOne({ externalId: item.externalId }).lean();
  if (exists) return false;
  const tTitle = await localizeToAll(item.title);
  const tSummary = await localizeToAll(item.summary);
  // Body is often the same text as the summary — avoid re-translating it.
  const tBody =
    item.body && item.body !== item.summary ? await localizeToAll(item.body) : tSummary;
  await News.create({
    section,
    category: item.category || category,
    source: item.source,
    url: item.url,
    imageUrl: item.image || "",
    publishedAt: item.publishedAt,
    externalId: item.externalId,
    title: tTitle,
    summary: tSummary,
    body: tBody,
  });
  return true;
}

/**
 * Fetch ALL matching farmer news (NewsData.io, paginated) and store them in the
 * "samachar" section. Translates to Gujarati. De-dups by externalId; 7-day
 * retention keeps the volume bounded.
 */
async function ingestNews() {
  const raw = await fetchAgriNews();
  let created = 0;
  let skipped = 0;
  for (const item of raw) {
    if (await storeArticle(item, "samachar", "general")) created++;
    else skipped++;
  }
  return { fetched: raw.length, created, skipped };
}

/**
 * Refresh the "yojana" (schemes) section:
 *   1. Curated evergreen Gujarat schemes (data/schemes.js) — kept fresh so they
 *      never age out; new ones are translated to Gujarati.
 *   2. Scraped farmer-scheme news (all matching items) so the tab stays current.
 * De-dups by externalId.
 */
async function ingestSchemes() {
  // 1) Curated evergreen Gujarat schemes.
  let curatedCreated = 0;
  let curatedRefreshed = 0;
  for (const s of SCHEMES) {
    const externalId = "scheme:" + slug(s.title);
    const existing = await News.findOne({ externalId }).lean();
    if (existing) {
      await News.updateOne(
        { externalId },
        { $set: { publishedAt: new Date(), source: s.source || "", url: s.url || "", imageUrl: s.image || "" } },
      );
      curatedRefreshed++;
      continue;
    }
    const title = await localizeToAll(s.title);
    const summary = await localizeToAll(s.summary);
    const body = await localizeToAll(s.body);
    await News.create({
      section: "yojana",
      category: "scheme",
      source: s.source || "",
      url: s.url || "",
      imageUrl: s.image || "",
      publishedAt: new Date(),
      externalId,
      title,
      summary,
      body,
    });
    curatedCreated++;
  }

  // 2) Scraped farmer-scheme news (all matching items).
  const raw = await fetchSchemeNews();
  let scraped = 0;
  let skipped = 0;
  for (const item of raw) {
    if (await storeArticle(item, "yojana", "scheme")) scraped++;
    else skipped++;
  }

  return { curatedCreated, curatedRefreshed, scraped, skipped, fetched: raw.length };
}

/**
 * Delete news/scheme items older than `days` (default 7). Curated evergreen
 * schemes (externalId "scheme:*") are kept — they're long-lived and refreshed
 * daily, and are what keeps the Yojana tab populated.
 */
async function purgeOld() {
  const newsCutoff = new Date(Date.now() - NEWS_RETENTION_DAYS * DAY_MS);
  const schemeCutoff = new Date(Date.now() - SCHEME_RETENTION_DAYS * DAY_MS);
  const del = await News.deleteMany({
    externalId: { $not: /^scheme:/ }, // curated evergreen schemes are always kept
    $or: [
      { section: "samachar", publishedAt: { $lt: newsCutoff } },
      { section: "yojana", publishedAt: { $lt: schemeCutoff } },
    ],
  });
  return { deleted: del.deletedCount || 0, newsCutoff, schemeCutoff };
}

/** Push a broadcast to every user that has an FCM token (+ notification-centre record). */
async function broadcastToUsers({ type = "news", title, body, data = {} }) {
  const users = await User.find({ fcmToken: { $exists: true, $nin: [null, ""] } })
    .select("_id fcmToken")
    .lean();
  let sent = 0;
  for (const u of users) {
    try {
      const r = await sendGenericNotification(u.fcmToken, { title, body, data });
      if (r.success) sent++;
    } catch (e) {
      /* skip this device */
    }
    try {
      await createNotification(u._id, { type, title, body, data });
    } catch (e) {
      /* non-fatal */
    }
  }
  return { users: users.length, sent };
}

/**
 * Full daily job: refresh news + Gujarat schemes, purge >7-day items, and — if
 * any NEW content was added — broadcast a push so users know there's an update.
 */
async function runDailyUpdate() {
  const news = await ingestNews();
  const schemes = await ingestSchemes();
  const purge = await purgeOld();

  const newSchemes = schemes.curatedCreated + schemes.scraped;
  let broadcast = { users: 0, sent: 0 };
  if (news.created > 0 || newSchemes > 0) {
    const parts = [];
    if (news.created > 0) parts.push(`${news.created} new farmer news`);
    if (newSchemes > 0) parts.push(`${newSchemes} scheme update${newSchemes > 1 ? "s" : ""}`);
    broadcast = await broadcastToUsers({
      type: news.created === 0 && newSchemes > 0 ? "scheme" : "news",
      title: "New updates on FarmerPulse",
      body: `${parts.join(" and ")} added today — tap to read.`,
      data: { type: "NEWS_UPDATE" },
    });
  }
  return { news, schemes, purge, broadcast };
}

/**
 * GET /api/v1/news?section=yojana|samachar&limit=30
 * Public. Returns items with title/summary/body as { en, hi, gu } so the app
 * shows content in the user's selected language.
 */
exports.getNews = async (req, res) => {
  try {
    const { section, limit } = req.query;

    // Farmer news (samachar) shows the last 7 days; schemes (yojana) the last
    // 30 days. Curated evergreen schemes (externalId "scheme:*") are always
    // exempt so the Yojana tab never empties out.
    const newsCutoff = new Date(Date.now() - NEWS_RETENTION_DAYS * DAY_MS);
    const schemeCutoff = new Date(Date.now() - SCHEME_RETENTION_DAYS * DAY_MS);

    const query = {
      isActive: true,
      $or: [
        { section: "samachar", publishedAt: { $gte: newsCutoff } },
        { section: "yojana", publishedAt: { $gte: schemeCutoff } },
        { externalId: { $regex: /^scheme:/ } },
      ],
    };
    if (section === "yojana" || section === "samachar") query.section = section;

    const items = await News.find(query)
      .sort({ publishedAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 30, 100))
      .lean();

    const data = items.map((n) => ({
      id: n._id,
      section: n.section,
      category: n.category,
      source: n.source,
      url: n.url,
      image: n.imageUrl || "",
      date: n.publishedAt,
      title: loc(n.title),
      summary: loc(n.summary),
      body: loc(n.body),
    }));

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("getNews error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch news", error: error.message });
  }
};

/**
 * POST /api/v1/news   (admin)
 * Add a curated item (typically a Sarkari Yojana scheme). Provide English text;
 * Hindi & Gujarati are auto-translated and stored.
 * Body: { section, category?, source?, url?, title, summary?, body?, publishedAt? }
 */
exports.createNews = async (req, res) => {
  try {
    const { section, category, source, url, title, summary, body, publishedAt } = req.body;
    if (!section || !title) {
      return res.status(400).json({ success: false, message: "'section' and 'title' are required" });
    }

    const tTitle = await localizeToAll(title);
    const tSummary = await localizeToAll(summary);
    const tBody = await localizeToAll(body);

    const doc = await News.create({
      section,
      category: category || (section === "yojana" ? "scheme" : "general"),
      source: source || "",
      url: url || "",
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      title: tTitle,
      summary: tSummary,
      body: tBody,
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error("createNews error:", error);
    return res.status(500).json({ success: false, message: "Failed to create news", error: error.message });
  }
};

/**
 * POST /api/v1/news/refresh — fetch the latest news only (manual runs).
 */
exports.refreshNews = async (req, res) => {
  try {
    const r = await ingestNews();
    // New data in → old data out: enforce the 7-day window immediately.
    const purge = await purgeOld();
    return res.json({ success: true, ...r, purged: purge.deleted });
  } catch (error) {
    console.error("refreshNews error:", error);
    return res.status(500).json({ success: false, message: "Failed to refresh news", error: error.message });
  }
};

/**
 * POST /api/v1/news/daily — the 6 AM job: refresh news + Gujarat schemes, then
 * delete anything older than 7 days.
 */
exports.runDaily = async (req, res) => {
  try {
    const result = await runDailyUpdate();
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("runDaily error:", error);
    return res.status(500).json({ success: false, message: "Daily update failed", error: error.message });
  }
};

// Internal helpers — used by the cron job and the standalone script.
exports.ingestNews = ingestNews;
exports.ingestSchemes = ingestSchemes;
exports.purgeOld = purgeOld;
exports.runDailyUpdate = runDailyUpdate;
