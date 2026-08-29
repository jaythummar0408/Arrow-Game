/**
 * Diagnostic: lists all price alerts (with the user's FCM-token status) and
 * today's priced market+commodity pairs, so you can see why an alert did or
 * didn't trigger.
 *
 *   node scripts/debugAlerts.js
 */
require("dotenv").config();
const connectDB = require("../config/database");
const { PriceAlert, MarketPrice } = require("../models");

(async () => {
  try {
    await connectDB();

    const alerts = await PriceAlert.find()
      .populate("district", "name")
      .populate("market", "name")
      .populate("commodity", "name")
      .populate("user", "name mobileNumber fcmToken")
      .lean();

    console.log(`\n=== PRICE ALERTS (${alerts.length}) ===`);
    if (alerts.length === 0) console.log("  (none — the app hasn't saved any alert yet)");
    for (const a of alerts) {
      console.log(
        `• ${a.commodity && a.commodity.name} @ ${a.market && a.market.name}, ${a.district && a.district.name} | ` +
          `target ₹${a.targetPrice} (${a.direction}) | active:${a.isActive} | ` +
          `user:${(a.user && (a.user.mobileNumber || a.user._id)) || "?"} | ` +
          `fcmToken:${a.user && a.user.fcmToken ? "YES" : "NO"}`,
      );
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const prices = await MarketPrice.find({
      arrival_date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
    })
      .populate("market", "name")
      .populate("commodity", "name")
      .lean();

    console.log(`\n=== TODAY'S PRICES (${prices.length}) ===`);
    for (const p of prices) {
      console.log(
        `• ${p.commodity && p.commodity.name} @ ${p.market && p.market.name} = ₹${p.modal_price}/quintal (≈₹${Math.round(p.modal_price / 5)}/20kg)`,
      );
    }

    process.exit(0);
  } catch (e) {
    console.error("debug failed:", e.message);
    process.exit(1);
  }
})();
