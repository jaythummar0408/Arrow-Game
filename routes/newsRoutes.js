const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// Public: the app reads news from here
router.get("/", newsController.getNews);

// Admin: add a curated scheme / news item (auto-translated)
router.post("/", verifyToken, requireAdmin, newsController.createNews);

// Trigger a fetch of the latest agriculture news only (manual)
router.post("/refresh", newsController.refreshNews);

// Full daily job: refresh news + Gujarat schemes, then delete >7-day-old items
router.post("/daily", newsController.runDaily);

module.exports = router;
