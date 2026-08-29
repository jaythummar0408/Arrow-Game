const express = require("express");
const router = express.Router();
const alertController = require("../controllers/alertController");
const { verifyToken } = require("../middleware/auth");

/**
 * @route   POST /api/v1/alerts
 * @desc    Create a new price alert
 * @access  Private
 */
router.post("/", verifyToken, alertController.createAlert);

/**
 * @route   GET /api/v1/alerts
 * @desc    Get all alerts for logged-in user
 * @access  Private
 * @query   isActive - Filter by active status (true/false)
 * @query   market - Filter by market ID
 * @query   commodity - Filter by commodity ID
 */
router.get("/", verifyToken, alertController.getMyAlerts);

/**
 * @route   GET /api/v1/alerts/stats
 * @desc    Get alert statistics for user
 * @access  Private
 */
router.get("/stats", verifyToken, alertController.getAlertStats);

/**
 * @route   GET /api/v1/alerts/:id
 * @desc    Get single alert by ID
 * @access  Private
 */
router.get("/:id", verifyToken, alertController.getAlertById);

/**
 * @route   PUT /api/v1/alerts/:id
 * @desc    Update an alert
 * @access  Private
 */
router.put("/:id", verifyToken, alertController.updateAlert);

/**
 * @route   DELETE /api/v1/alerts/:id
 * @desc    Delete an alert
 * @access  Private
 */
router.delete("/:id", verifyToken, alertController.deleteAlert);

/**
 * @route   POST /api/v1/alerts/:id/toggle
 * @desc    Toggle alert active/inactive status
 * @access  Private
 */
router.post("/:id/toggle", verifyToken, alertController.toggleAlert);

module.exports = router;
