require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const {
  PriceAlert,
  District,
  Market,
  Commodity,
  Variety,
  Grade,
  User,
  MarketPrice,
} = require("../models");
const { sendPriceAlertNotification } = require("../utils/firebaseNotification");
const { createNotification } = require("../controllers/notificationController");

/**
 * Fetch today's price data from database
 */
async function fetchTodayPrices() {
  try {
    console.log("📡 Fetching today's prices from database...");

    // Get today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    // Query today's price records from database
    const priceRecords = await MarketPrice.find({
      arrival_date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    })
      .populate("district", "name name_gj")
      .populate("market", "name name_gj")
      .populate("commodity", "name name_gj img_url")
      .populate("variety", "name name_gj")
      .populate("grade", "name name_gj")
      .lean();
    // Transform to match expected format
    const records = priceRecords.map((record) => ({
      district: record.district?.name || "",
      market: record.market?.name || "",
      commodity: record.commodity?.name || "",
      variety: record.variety?.name || "",
      grade: record.grade?.name || "",
      modal_price: record.modal_price,
      min_price: record.min_price,
      max_price: record.max_price,
      arrival_date: record.arrival_date,
    }));

    console.log(`✅ Fetched ${records.length} price records from database`);
    return records;
  } catch (error) {
    console.error("❌ Error fetching prices from database:", error.message);
    return [];
  }
}

/**
 * Get district ID by name
 */
async function getDistrictIdByName(districtName) {
  const district = await District.findOne({
    $or: [
      { name: districtName },
      { name: new RegExp(`^${districtName}$`, "i") },
      { name_gj: new RegExp(`^${districtName}$`, "i") },
    ],
  }).select("_id name");
  return district;
}

/**
 * Get market ID by name and district
 */
async function getMarketIdByName(marketName, districtId) {
  const market = await Market.findOne({
    district: districtId,
    $or: [
      { name: marketName },
      { name: new RegExp(`^${marketName}$`, "i") },
      { name_gj: new RegExp(`^${marketName}$`, "i") },
    ],
  }).select("_id name");
  return market;
}

/**
 * Get commodity ID by name
 */
async function getCommodityIdByName(commodityName) {
  const commodity = await Commodity.findOne({
    $or: [
      { name: commodityName },
      { name: new RegExp(`^${commodityName}$`, "i") },
      { name_gj: new RegExp(`^${commodityName}$`, "i") },
    ],
  }).select("_id name");
  return commodity;
}

/**
 * Check if alert condition is met
 */
function isAlertTriggered(alert, currentPrice) {
  if (alert.direction === "up") {
    return currentPrice >= alert.targetPrice;
  } else if (alert.direction === "down") {
    return currentPrice <= alert.targetPrice;
  }
  return false;
}

/**
 * Process alerts for a specific price record
 */
async function processAlertsForPrice(priceRecord) {
  try {
    const {
      district: districtName,
      market: marketName,
      commodity: commodityName,
      variety: varietyName,
      grade: gradeName,
      modal_price: modalPrice,
    } = priceRecord;

    // Parse price
    const currentPrice = parseFloat(modalPrice);
    if (isNaN(currentPrice)) {
      return { processed: 0, notified: 0 };
    }

    // Get district ID
    const district = await getDistrictIdByName(districtName);
    if (!district) {
      console.log(`⚠️  District not found: ${districtName}`);
      return { processed: 0, notified: 0 };
    }

    // Get market ID
    const market = await getMarketIdByName(marketName, district._id);
    if (!market) {
      console.log(`⚠️  Market not found: ${marketName} in ${districtName}`);
      return { processed: 0, notified: 0 };
    }

    // Get commodity ID
    const commodity = await getCommodityIdByName(commodityName);
    if (!commodity) {
      console.log(`⚠️  Commodity not found: ${commodityName}`);
      return { processed: 0, notified: 0 };
    }

    // Find all active alerts for this district-market-commodity
    const alerts = await PriceAlert.find({
      district: district._id,
      market: market._id,
      commodity: commodity._id,
      isActive: true,
    })
      .populate("user", "fcmToken mobile")
      .populate("variety", "name name_gj")
      .populate("grade", "name name_gj");

    if (alerts.length === 0) {
      return { processed: 0, notified: 0 };
    }

    console.log(
      `🔍 Found ${alerts.length} active alerts for ${commodityName} in ${marketName}`,
    );

    let notifiedCount = 0;
    const alertsToDelete = [];

    // Check each alert
    for (const alert of alerts) {
      // Check if price meets alert condition
      if (!isAlertTriggered(alert, currentPrice)) {
        continue;
      }

      // Check if user has FCM token
      if (!alert.user || !alert.user.fcmToken) {
        console.log(`⚠️  User ${alert.user?._id} has no FCM token`);
        alertsToDelete.push(alert._id);
        continue;
      }

      // Prepare alert data for notification
      const alertData = {
        districtName: district.name,
        marketName: market.name,
        commodityName: commodity.name,
        varietyName: alert.variety?.name || null,
        gradeName: alert.grade?.name || null,
        targetPrice: alert.targetPrice,
        currentPrice: currentPrice,
        direction: alert.direction,
      };

      // Send notification
      const result = await sendPriceAlertNotification(
        alert.user.fcmToken,
        alertData,
      );

      if (result.success) {
        // Mirror it into the in-app notification centre.
        try {
          await createNotification(alert.user._id, {
            type: "price_alert",
            title: `Price Alert: ${commodity.name}`,
            body: `${market.name}, ${district.name} — reached ₹${currentPrice} (target ₹${alert.targetPrice}, ${alert.direction})`,
            data: { type: "PRICE_ALERT", commodity: commodity.name, market: market.name },
          });
        } catch (e) {
          console.warn("Failed to save notification record:", e.message);
        }
        console.log(
          `✅ Notification sent to user ${alert.user.mobile} for ${commodityName}`,
        );
        notifiedCount++;
        alertsToDelete.push(alert._id);
      } else {
        console.log(
          `❌ Failed to send notification to user ${alert.user.mobile}`,
        );
        // Still delete alert even if notification fails
        alertsToDelete.push(alert._id);
      }
    }

    // Delete all triggered alerts
    if (alertsToDelete.length > 0) {
      await PriceAlert.deleteMany({ _id: { $in: alertsToDelete } });
      console.log(`🗑️  Deleted ${alertsToDelete.length} triggered alerts`);
    }

    return { processed: alerts.length, notified: notifiedCount };
  } catch (error) {
    console.error("❌ Error processing alerts for price record:", error);
    return { processed: 0, notified: 0 };
  }
}

/**
 * Main cron job function
 */
async function checkPriceAlerts() {
  try {
    console.log("\n🚀 Starting price alert check...");
    console.log(`⏰ Time: ${new Date().toLocaleString()}\n`);

    // Connect via the shared connector so it picks up MONGO_URI_PROD /
    // MONGO_URI_DEV from .env (not a bare MONGO_URI).
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Fetch today's prices
    const priceRecords = await fetchTodayPrices();

    if (priceRecords.length === 0) {
      console.log("⚠️  No price records found for today");
      return;
    }

    // Group price records by district for efficiency
    const districtGroups = {};
    priceRecords.forEach((record) => {
      const district = record.district;
      if (!districtGroups[district]) {
        districtGroups[district] = [];
      }
      districtGroups[district].push(record);
    });

    console.log(
      `📊 Processing ${priceRecords.length} records from ${
        Object.keys(districtGroups).length
      } districts\n`,
    );

    // Process each price record
    let totalProcessed = 0;
    let totalNotified = 0;

    for (const record of priceRecords) {
      const result = await processAlertsForPrice(record);
      totalProcessed += result.processed;
      totalNotified += result.notified;
    }

    console.log("\n✅ Price alert check completed!");
    console.log(`📈 Total alerts checked: ${totalProcessed}`);
    console.log(`📲 Notifications sent: ${totalNotified}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}\n`);
  } catch (error) {
    console.error("❌ Error in checkPriceAlerts:", error);
  }
}

// Run if called directly
if (require.main === module) {
  checkPriceAlerts()
    .then(() => {
      console.log("✅ Cron job completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Cron job failed:", error);
      process.exit(1);
    });
}

module.exports = { checkPriceAlerts };
