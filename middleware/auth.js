const jwt = require("jsonwebtoken");
const { User } = require("../models");

/**
 * Middleware to verify JWT access token
 */
exports.verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "No token provided. Authorization header must be 'Bearer <token>'",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please refresh your token.",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      mobileNumber: decoded.mobileNumber,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying token",
      error: error.message,
    });
  }
};

/**
 * Middleware to check if user has specific role(s)
 */
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is a farmer
 */
exports.requireFarmer = (req, res, next) => {
  return exports.requireRole("farmer")(req, res, next);
};

/**
 * Middleware to check if user is a trader
 */
exports.requireTrader = (req, res, next) => {
  return exports.requireRole("trader")(req, res, next);
};

/**
 * Middleware to check if user is an admin
 */
exports.requireAdmin = (req, res, next) => {
  return exports.requireRole("admin")(req, res, next);
};

/**
 * Optional authentication - doesn't reject if no token
 * Useful for endpoints that work both with and without auth
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - continue without auth
      return next();
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      // Check if user exists and is active
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          userId: decoded.userId,
          mobileNumber: decoded.mobileNumber,
          role: decoded.role,
          name: decoded.name,
        };
      }
    } catch (error) {
      // Token invalid or expired - continue without auth
      console.log("Optional auth - token invalid:", error.message);
    }

    next();
  } catch (error) {
    // Any error - continue without auth
    next();
  }
};
