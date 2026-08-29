const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/auth");

// All routes are per-user (requires auth).
router.get("/", verifyToken, notificationController.getMyNotifications);
router.get("/unread-count", verifyToken, notificationController.getUnreadCount);
router.put("/read-all", verifyToken, notificationController.markAllRead);
router.put("/:id/read", verifyToken, notificationController.markRead);
router.delete("/:id", verifyToken, notificationController.deleteNotification);
router.delete("/", verifyToken, notificationController.clearAll);

module.exports = router;
