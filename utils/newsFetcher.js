/**
 * News fetcher for the "Khedut Samachar" (farmer news) feed.
 *
 * When NEWSDATA_API_KEY is set, NewsData.io is the source (its `description`
 * gives a real article summary — a proper paragraph). Without a key, or with
 * NEWS_SOURCE=google, it falls back to Google News RSS (free, headline-only).
 *
 * Whatever the source, results are filtered to agriculture-related items so
 * off-topic headlines (politics, cricket, gadgets, etc.) are dropped.
 */
const axios = require("axios");
const crypto = require("crypto");

const hash = (s) => crypto.createHash("md5").update(String(s)).digest("hex");

const stripHtml = (s) => {
  let t = String(s || "");
  // RSS <description> is often entity-encoded HTML (&lt;a href=…&gt;Title&lt;/a&gt;).
  // Turn the encoded tags back into real tags FIRST, then strip all tags —
  // otherwise the whole <a …> anchor (with its giant redirect URL) survives.
  t = t.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
  t = t.replace(/<[^>]*>/g, " ");
  // decode the remaining common entities
  t = t
    .replace(/&nbsp;/gi, " ")
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&");
  return t.replace(/\s+/g, " ").trim();
};

// Only keep items that actually look like agriculture / farmer news.
const AGRI_RE =
  /\b(agri|agricultur|farmer|farming|\bfarm\b|crop|mandi|apmc|kisan|khedut|harvest|sowing|monsoon|irrigat|fertiliz|fertilis|pesticide|\bmsp\b|rabi|kharif|horticultur|wheat|cotton|groundnut|paddy|\brice\b|maize|bajra|jowar|castor|cumin|soybean|soyabean|mustard|onion|potato|tomato|sugarcane|pulses|oilseed|\byield\b|drought|\bseed\b|dairy|livestock|pm-kisan|pmfby|pmksy|subsidy)\b/i;

const isAgri = (item) => AGRI_RE.test(`${item.title} ${item.summary}`);

const PAID_MARKER = /only available in paid plans/i;

async function fetchFromNewsData(query, maxPages = 3) {
  const items = [];
  let page;
  for (let i = 0; i < maxPages; i++) {
    const params = {
      apikey: process.env.NEWSDATA_API_KEY,
      country: "in",
      language: "en",
      q: query,
    };
    if (page) params.page = page;

    let data;
    try {
      const res = await axios.get("https://newsdata.io/api/1/news", { params, timeout: 20000 });
      data = res.data || {};
    } catch (e) {
      // Rate-limit / quota / bad page — stop paging, keep what we already have.
      break;
    }

    const results = Array.isArray(data.results) ? data.results : [];
    for (const r of results) {
      const title = stripHtml(r.title);
      if (!title) continue;
      const summary = stripHtml(r.description);
      let body = stripHtml(r.content);
      if (!body || PAID_MARKER.test(body)) body = summary; // free tier hides content
      items.push({
        externalId: r.article_id || hash(r.link || title),
        title,
        summary,
        body: body || summary,
        url: r.link || "",
        source: r.source_id || r.source_name || "NewsData",
        image: r.image_url || "",
        publishedAt: r.pubDate ? new Date(r.pubDate) : new Date(),
      });
    }

    page = data.nextPage;
    if (!page) break;
    await new Promise((res) => setTimeout(res, 400)); // be gentle between pages
  }
  // Items that actually carry a description (a real paragraph) come first.
  return items.sort((a, b) => (b.summary ? 1 : 0) - (a.summary ? 1 : 0));
}

async function fetchFromGoogleRss(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const res = await axios.get(url, {
    timeout: 20000,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; FarmerPulse/1.0)" },
  });
  const xml = String(res.data || "");
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const cdata = (s) => s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
  const pick = (block, tag) => {
    const r = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(block);
    return r ? cdata(r[1]) : "";
  };
  let m;
  while ((m = itemRe.exec(xml)) && items.length < 30) {
    const block = m[1];
    const title = stripHtml(pick(block, "title"));
    if (!title) continue;
    const link = pick(block, "link");
    const pubDate = pick(block, "pubDate");
    const desc = stripHtml(pick(block, "description"));
    // Google News titles end with " - Source"
    const parts = title.split(" - ");
    const source = parts.length > 1 ? parts.pop().trim() : "Google News";
    const cleanTitle = parts.join(" - ") || title;
    items.push({
      externalId: hash(link || title),
      title: cleanTitle,
      summary: desc.slice(0, 240),
      body: desc || cleanTitle,
      url: link,
      source,
      image: "",
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
    });
  }
  return items;
}

/**
 * Krishi Jagran — India's largest agri publication. Its FeedBurner "latest"
 * feed carries a real paragraph <description> AND an article image
 * (<media:content> / <media:thumbnail>), so cards can show a photo. The whole
 * publication is agriculture, so we trust every item and only classify it into
 * a section (samachar / yojana) + a display category.
 */
const KRISHIJAGRAN_FEED =
  process.env.KRISHIJAGRAN_FEED_URL || "https://feeds.feedburner.com/krishijagran/latest";

const KJ_SCHEME_RE =
  /\b(yojana|scheme|subsid(y|ies)|pm-?kisan|pmfby|pmksy|kisan credit|\bkcc\b|insurance|grant|loan waiver|sarkari|beneficiar|govt\.? (scheme|plan)|government (scheme|plan|subsidy))\b/i;
const KJ_WEATHER_RE = /\b(weather|rain|rainfall|monsoon|\bimd\b|forecast|cyclone|heatwave|cold wave|drought|flood)\b/i;
const KJ_MARKET_RE = /\b(price|prices|mandi|market|rate|\bmsp\b|export|import|demand|commodity|wholesale|procurement)\b/i;
const KJ_TIP_RE = /\b(how to|tips?|guide|technique|method|cultivation|cultivate|grow|variety|varieties|best practice|管理|manage|control (pest|disease))\b/i;

const classifyKj = (item) => {
  const t = `${item.title} ${item.summary}`;
  if (KJ_SCHEME_RE.test(t)) return { section: "yojana", category: "scheme" };
  let category = "general";
  if (KJ_WEATHER_RE.test(t)) category = "weather";
  else if (KJ_MARKET_RE.test(t)) category = "market";
  else if (KJ_TIP_RE.test(t)) category = "tip";
  return { section: "samachar", category };
};

async function fetchFromKrishiJagran(feedUrl = KRISHIJAGRAN_FEED) {
  const res = await axios.get(feedUrl, {
    timeout: 20000,
    responseType: "arraybuffer", // decode as UTF-8 ourselves so ₹ etc. survive
    headers: { "User-Agent": "Mozilla/5.0 (compatible; FarmerPulse/1.0)" },
  });
  const xml = Buffer.from(res.data).toString("utf8");
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const cdata = (s) => s.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();
  const pick = (block, tag) => {
    const r = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(block);
    return r ? cdata(r[1]) : "";
  };
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const title = stripHtml(pick(block, "title"));
    if (!title) continue;
    const link = pick(block, "link");
    const summary = stripHtml(pick(block, "description"));
    const pubDate = pick(block, "pubDate");
    const imgM =
      /<media:content[^>]*\burl="([^"]+)"/.exec(block) ||
      /<media:thumbnail[^>]*\burl="([^"]+)"/.exec(block);
    const base = {
      externalId: hash(link || title),
      title,
      summary,
      body: summary, // feed has no full body; summary is a real paragraph
      url: link,
      source: "Krishi Jagran",
      image: imgM ? imgM[1] : "",
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
    };
    items.push({ ...base, ...classifyKj(base) });
  }
  return items;
}

// Keyword queries. No hard item cap — the daily job stores everything that
// matches, and 7-day retention keeps the DB bounded. NEWS_MAX_PAGES controls
// how many NewsData pages (≈10 articles each) are pulled per feed.
const NEWS_QUERY = "agriculture OR farmer OR farming OR crop OR mandi OR kisan";
const SCHEME_QUERY =
  "kisan yojana OR farmer scheme OR agriculture subsidy OR PM-Kisan OR PMFBY OR crop insurance OR kisan credit card";
const MAX_PAGES = Number(process.env.NEWS_MAX_PAGES) || 3;

/**
 * Fetch agriculture/farmer items for a query, filtered to agriculture-related
 * ones. Prefers NewsData.io (real summaries) when a key is set; otherwise
 * Google News RSS. Force Google with NEWS_SOURCE=google.
 */
async function fetchAgri(query, label) {
  try {
    const useNewsData =
      !!process.env.NEWSDATA_API_KEY && process.env.NEWS_SOURCE !== "google";
    const googleQuery = `(${query}) India`;

    let raw = useNewsData
      ? await fetchFromNewsData(query, MAX_PAGES)
      : await fetchFromGoogleRss(googleQuery);
    let agri = raw.filter(isAgri);

    // If NewsData came back empty (missing/invalid key, quota, etc.), fall
    // back to Google News so a refresh is never left with nothing.
    if (useNewsData && agri.length === 0) {
      raw = await fetchFromGoogleRss(googleQuery);
      agri = raw.filter(isAgri);
      console.log(`   ${label}: Google News RSS (fallback) — ${raw.length} fetched, ${agri.length} kept.`);
      return agri;
    }

    console.log(
      `   ${label}: ${useNewsData ? "NewsData.io" : "Google News RSS"} — ${raw.length} fetched, ${agri.length} kept.`,
    );
    return agri;
  } catch (err) {
    console.error(`${label} fetch failed:`, err.message);
    return [];
  }
}

/** Pull + classify the Krishi Jagran feed once; [] on any failure. */
async function fetchKrishiJagranSafe() {
  try {
    const items = await fetchFromKrishiJagran();
    return items;
  } catch (err) {
    console.error("Krishi Jagran fetch failed:", err.message);
    return [];
  }
}

/**
 * Latest farmer news (samachar). Krishi Jagran is the primary source (real
 * paragraphs + images); if it's unavailable, fall back to NewsData/Google.
 */
async function fetchAgriNews() {
  const kj = await fetchKrishiJagranSafe();
  const samachar = kj.filter((i) => i.section === "samachar");
  if (samachar.length > 0) {
    console.log(`   News: Krishi Jagran — ${kj.length} fetched, ${samachar.length} samachar kept.`);
    return samachar;
  }
  return fetchAgri(NEWS_QUERY, "News");
}

/**
 * Latest farmer scheme news (yojana). Krishi Jagran first; fall back to
 * NewsData/Google scheme query if it has no scheme items.
 */
async function fetchSchemeNews() {
  const kj = await fetchKrishiJagranSafe();
  const yojana = kj.filter((i) => i.section === "yojana");
  if (yojana.length > 0) {
    console.log(`   Schemes: Krishi Jagran — ${yojana.length} yojana kept.`);
    return yojana;
  }
  return fetchAgri(SCHEME_QUERY, "Schemes");
}

module.exports = { fetchAgriNews, fetchSchemeNews, fetchFromKrishiJagran };
