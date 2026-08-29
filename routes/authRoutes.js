const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");
const { upload } = require("../utils/cloudinary");

// REMOVED: /check-mobile and /signup routes
// New flow: Users are auto-created during login if they don't exist
// Only one endpoint needed: /login

/**
 * @route   POST /api/auth/login
 * @desc    Login user (auto-creates user if not exists)
 * @access  Public
 */
router.post("/login", authController.login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", verifyToken, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", verifyToken, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", verifyToken, (req, res, next) => {
  upload.single("profilePic")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ success: false, message: "Image upload failed: " + err.message });
    }
    next();
  });
}, authController.updateProfile);

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Verify phone number
 * @access  Private
 */
router.post("/verify-phone", verifyToken, authController.verifyPhone);

/**
 * @route   PUT /api/auth/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
router.put("/fcm-token", verifyToken, authController.updateFcmToken);

module.exports = router;
