/**
 * Prints today's priced markets grouped by district, with the commodities and
 * prices available in each — so you know exactly what district + market + crop
 * to pick in the app to test an alert.
 *
 *   node scripts/todayMarkets.js
 */
require("dotenv").config();
const connectDB = require("../config/database");
const { MarketPrice } = require("../models");

(async () => {
  try {
    await connectDB();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const prices = await MarketPrice.find({
      arrival_date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
    })
      .populate("district", "name")
      .populate("market", "name")
      .populate("commodity", "name")
      .lean();

    const byMarket = {};
    for (const p of prices) {
      const key = `${p.district && p.district.name}  →  ${p.market && p.market.name}`;
      if (!byMarket[key]) byMarket[key] = [];
      byMarket[key].push(
        `${p.commodity && p.commodity.name} — ₹${p.modal_price}/quintal (≈₹${Math.round(p.modal_price / 5)}/20kg)`,
      );
    }

    console.log("\n=== TODAY'S MARKETS (pick one of these in the app) ===");
    for (const key of Object.keys(byMarket)) {
      console.log(`\n▶ ${key}`);
      byMarket[key].forEach((c) => console.log(`    - ${c}`));
    }
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
