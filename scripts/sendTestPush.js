/**
 * Sends ONE test price-alert push to a registered device — to prove FCM
 * delivery works end-to-end (independent of price matching).
 *
 *   node scripts/sendTestPush.js              # first user with an FCM token
 *   node scripts/sendTestPush.js 9904185538   # a specific user by mobile
 */
require("dotenv").config();
const connectDB = require("../config/database");
const { User } = require("../models");
const { sendPriceAlertNotification } = require("../utils/firebaseNotification");
const { createNotification } = require("../controllers/notificationController");

(async () => {
  try {
    await connectDB();
    const mobile = process.argv[2];
    const user = await User.findOne(
      mobile ? { mobileNumber: mobile } : { fcmToken: { $exists: true, $ne: null } },
    ).select("mobileNumber fcmToken");

    if (!user || !user.fcmToken) {
      console.log("⚠️  No user with an FCM token found.");
      process.exit(0);
    }

    console.log(`📲 Sending test push to ${user.mobileNumber}...`);
    const res = await sendPriceAlertNotification(user.fcmToken, {
      districtName: "Junagadh",
      marketName: "Junagadh APMC",
      commodityName: "Groundnut",
      targetPrice: 6000,
      currentPrice: 6200,
      direction: "up",
    });

    console.log(res.success ? `✅ Sent! messageId: ${res.messageId}` : `❌ Failed: ${res.error}`);

    // Also record it in the notification centre so it shows in the app list.
    await createNotification(user._id, {
      type: "price_alert",
      title: "Price Alert: Groundnut",
      body: "Junagadh APMC — reached ₹6200 (target ₹6000, up)",
      data: { type: "PRICE_ALERT" },
    });
    console.log("📝 Notification-centre record created.");
    process.exit(0);
  } catch (e) {
    console.error("Test push failed:", e.message);
    process.exit(1);
  }
})();
