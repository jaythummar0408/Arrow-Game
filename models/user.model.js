const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false, // Optional - auto-generated if not provided during login
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit mobile number"],
      index: true,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while keeping uniqueness
    },
    role: {
      type: String,
      enum: ["farmer", "trader", "admin"],
      default: "farmer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // Additional farmer-specific fields (optional)
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "gu", "hi"],
      default: "gu", // Gujarati as default for farmers
    },
    fcmToken: {
      type: String,
      default: null, // Firebase Cloud Messaging token for push notifications
    },
    profilePic: {
      type: String,
      default: null, // URL from cloudinary
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// Index for faster queries
userSchema.index({ mobileNumber: 1, isActive: 1 });
// Note: firebaseUid index is already created by unique: true and index: true in schema definition

// Method to generate tokens payload
userSchema.methods.getTokenPayload = function () {
  return {
    userId: this._id,
    mobileNumber: this.mobileNumber,
    role: this.role,
    name: this.name,
  };
};

// Method to check if user can login
userSchema.methods.canLogin = function () {
  return this.isActive && this.isPhoneVerified;
};

// Static method to find by mobile number
userSchema.statics.findByMobileNumber = function (mobileNumber) {
  return this.findOne({ mobileNumber, isActive: true });
};

// Static method to find by Firebase UID
userSchema.statics.findByFirebaseUid = function (firebaseUid) {
  return this.findOne({ firebaseUid, isActive: true });
};

module.exports = mongoose.model("User", userSchema);
