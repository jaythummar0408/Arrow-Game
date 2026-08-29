const { getFirebaseAdmin } = require("./firebase");
const admin = getFirebaseAdmin();

/**
 * Send price alert notification to user
 * @param {String} fcmToken - User's FCM device token
 * @param {Object} alertData - Alert details
 * @returns {Promise} - Firebase send result
 */
async function sendPriceAlertNotification(fcmToken, alertData) {
  try {
    const {
      districtName,
      marketName,
      commodityName,
      varietyName,
      gradeName,
      targetPrice,
      currentPrice,
      direction,
    } = alertData;

    // Build notification title
    const title = `Price Alert: ${commodityName}`;

    // Build notification body
    let body = `${marketName}, ${districtName}\n`;

    if (varietyName) {
      body += `Variety: ${varietyName}\n`;
    }
    if (gradeName) {
      body += `Grade: ${gradeName}\n`;
    }

    if (direction === "up") {
      body += `Price reached ₹${currentPrice} (Target: ₹${targetPrice})\n`;
      body += `Price went above your target!`;
    } else {
      body += `Price dropped to ₹${currentPrice} (Target: ₹${targetPrice})\n`;
      body += `Price went below your target!`;
    }

    // Prepare notification message
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: {
        type: "PRICE_ALERT",
        district: districtName,
        market: marketName,
        commodity: commodityName,
        variety: varietyName || "",
        grade: gradeName || "",
        targetPrice: String(targetPrice),
        currentPrice: String(currentPrice),
        direction: direction,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "price_alerts",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    // Send notification
    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent successfully:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a generic notification (used for news / scheme broadcasts).
 * @param {String} fcmToken
 * @param {{title:string, body:string, data?:Object}} payload
 */
async function sendGenericNotification(fcmToken, { title, body, data = {} }) {
  try {
    const stringData = {};
    for (const [k, v] of Object.entries(data)) stringData[k] = String(v);
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: stringData,
      android: {
        priority: "high",
        notification: { sound: "default", channelId: "price_alerts" },
      },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    };
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ Error sending notification:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk notifications to multiple users
 * @param {Array} notifications - Array of {fcmToken, alertData}
 * @returns {Promise} - Results array
 */
async function sendBulkNotifications(notifications) {
  const results = [];

  for (const notif of notifications) {
    const result = await sendPriceAlertNotification(
      notif.fcmToken,
      notif.alertData,
    );
    results.push({
      userId: notif.userId,
      alertId: notif.alertId,
      ...result,
    });
  }

  return results;
}

module.exports = {
  sendPriceAlertNotification,
  sendGenericNotification,
  sendBulkNotifications,
};
