const { Notification } = require("../models");

const MAX_PER_USER = 50; // keep the notification centre bounded

/**
 * Create a notification record for a user (called whenever a push is sent, so
 * the notification centre mirrors what was delivered). Trims to MAX_PER_USER.
 */
async function createNotification(userId, { type = "general", title, body = "", data = {} }) {
  if (!userId || !title) return null;
  const doc = await Notification.create({ user: userId, type, title, body, data });
  const count = await Notification.countDocuments({ user: userId });
  if (count > MAX_PER_USER) {
    const old = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(MAX_PER_USER)
      .select("_id")
      .lean();
    if (old.length) {
      await Notification.deleteMany({ _id: { $in: old.map((d) => d._id) } });
    }
  }
  return doc;
}
exports.createNotification = createNotification;

/** GET /api/v1/notifications */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const items = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const unread = await Notification.countDocuments({ user: userId, isRead: false });
    return res.json({ success: true, count: items.length, unread, data: items });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications", error: error.message });
  }
};

/** GET /api/v1/notifications/unread-count */
exports.getUnreadCount = async (req, res) => {
  try {
    const unread = await Notification.countDocuments({ user: req.user.userId, isRead: false });
    return res.json({ success: true, unread });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
};

/** PUT /api/v1/notifications/read-all */
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.userId, isRead: false }, { $set: { isRead: true } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
};

/** PUT /api/v1/notifications/:id/read */
exports.markRead = async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user.userId }, { $set: { isRead: true } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
};

/** DELETE /api/v1/notifications/:id */
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, user: req.user.userId });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
};

/** DELETE /api/v1/notifications  (clear all for the user) */
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.userId });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed", error: error.message });
  }
};
