const jwt = require("jsonwebtoken");
const { getFirebaseAdmin } = require("../utils/firebase");
const { User } = require("../models");

const admin = getFirebaseAdmin();

// Token generation helpers
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15d", // 15 days
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d", // 30 days
  });
};

// REMOVED: check-mobile endpoint - no longer needed with auto-create login flow
// Users are now automatically created during login if they don't exist

// REMOVED: signup endpoint - no longer needed with auto-create login flow
// Users are now automatically created during login if they don't exist

/**
 * @route   POST /api/auth/login
 * @desc    Login user with mobile number and Firebase token (auto-creates user if not exists)
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const {
      mobileNumber,
      firebaseIdToken,
      role = "farmer",
      preferredLanguage,
    } = req.body;

    // Validation
    if (!mobileNumber || !firebaseIdToken) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and Firebase token are required",
      });
    }

    // Validate mobile number format
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number",
      });
    }

    // Validate preferredLanguage if provided
    if (preferredLanguage && !["en", "gu", "hi"].includes(preferredLanguage)) {
      return res.status(400).json({
        success: false,
        message:
          "Preferred language must be 'en' (English), 'gu' (Gujarati), or 'hi' (Hindi)",
      });
    }

    // Verify Firebase token first
    let decodedToken;
    let firebaseUid;
    let isPhoneVerified = false;

    // Skip Firebase verification in test mode (for development/testing only)
    if (
      firebaseIdToken === "dummy-token-for-testing" &&
      process.env.NODE_ENV !== "production"
    ) {
      firebaseUid = `test_${mobileNumber}`;
      isPhoneVerified = true;
      console.log("⚠️  Using test mode - Firebase verification skipped");
    } else {
      try {
        decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
        firebaseUid = decodedToken.uid;

        // Verify that the phone number matches
        const firebaseUser = await admin.auth().getUser(firebaseUid);
        if (
          firebaseUser.phoneNumber &&
          firebaseUser.phoneNumber.includes(mobileNumber)
        ) {
          isPhoneVerified = true;
        }
      } catch (error) {
        console.error("Firebase token verification failed:", error);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired Firebase token",
        });
      }
    }

    // Find or create user
    let user = await User.findByMobileNumber(mobileNumber);
    let isNewUser = false;

    if (!user) {
      // Auto-create new user with default name (user can update via profile API)
      isNewUser = true;
      const userName = `User_${mobileNumber.slice(-4)}`; // Default name based on mobile number

      user = new User({
        name: userName,
        mobileNumber,
        firebaseUid,
        role,
        isPhoneVerified,
        preferredLanguage: preferredLanguage || "gu", // Set preferred language during creation (default: Gujarati)
      });

      await user.save();
      console.log(
        `✅ New user auto-created: ${mobileNumber} with language: ${preferredLanguage || "gu"}`,
      );
    } else {
      // Existing user - update Firebase UID if not set
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
      }

      // Update phone verification status
      if (isPhoneVerified && !user.isPhoneVerified) {
        user.isPhoneVerified = true;
      }

      // Update preferred language if provided
      if (preferredLanguage) {
        user.preferredLanguage = preferredLanguage;
        console.log(
          `✅ Updated preferred language for ${mobileNumber}: ${preferredLanguage}`,
        );
      }
    }

    // Generate tokens
    const tokenPayload = user.getTokenPayload();
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update refresh token and last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: isNewUser
        ? "Account created and logged in successfully"
        : "Login successful",
      data: {
        isNewUser,
        user: {
          id: user._id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          role: user.role,
          isPhoneVerified: user.isPhoneVerified,
          preferredLanguage: user.preferredLanguage,
        },
        tokens: {
          accessToken,
          refreshToken,
          accessTokenExpiresIn: "15d",
          refreshTokenExpiresIn: "30d",
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Generate new access token
    const tokenPayload = user.getTokenPayload();
    const newAccessToken = generateAccessToken(tokenPayload);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        accessTokenExpiresIn: "15d",
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Error refreshing token",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user by removing refresh token
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Remove refresh token from database
    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select("-refreshToken")
      .populate("district", "name gujaratiName")
      .populate("market", "name gujaratiName");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;
    let profilePic = null;

    if (req.file && req.file.path) {
      profilePic = req.file.path; // Cloudinary URL
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (profilePic) updateData.profilePic = profilePic;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-refreshToken")
      .populate("district", "name gujaratiName")
      .populate("market", "name gujaratiName");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Verify phone number with Firebase token
 * @access  Private
 */
exports.verifyPhone = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firebaseIdToken } = req.body;

    if (!firebaseIdToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase token is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify Firebase token
    try {
      initializeFirebase();
      const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);

      user.firebaseUid = decodedToken.uid;
      user.isPhoneVerified = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Phone verified successfully",
        data: {
          isPhoneVerified: true,
        },
      });
    } catch (error) {
      console.error("Firebase verification failed:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase token",
      });
    }
  } catch (error) {
    console.error("Verify phone error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying phone",
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/v1/auth/fcm-token
 * @desc    Update user's FCM token for push notifications
 * @access  Private
 */
exports.updateFcmToken = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.fcmToken = fcmToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: "FCM token updated successfully",
      data: {
        fcmTokenUpdated: true,
      },
    });
  } catch (error) {
    console.error("Update FCM token error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating FCM token",
      error: error.message,
    });
  }
};
