const mongoose = require("mongoose");

const priceAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: [true, "District is required"],
      index: true,
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      required: [true, "Market is required"],
      index: true,
    },
    commodity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commodity",
      required: [true, "Commodity is required"],
      index: true,
    },
    variety: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variety",
      required: false, // Optional - alert can be for any variety of the commodity
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: false, // Optional - alert can be for any grade
    },
    targetPrice: {
      type: Number,
      required: [true, "Target price is required"],
      min: [0, "Target price cannot be negative"],
    },
    direction: {
      type: String,
      enum: ["up", "down"],
      required: [true, "Direction is required"],
      // "up" = notify when price goes above targetPrice
      // "down" = notify when price goes below targetPrice
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// Compound indexes for efficient queries
priceAlertSchema.index({ user: 1, isActive: 1 });
priceAlertSchema.index({ market: 1, commodity: 1, isActive: 1 });
priceAlertSchema.index({
  user: 1,
  market: 1,
  commodity: 1,
  variety: 1,
  grade: 1,
});

// Method to check if price triggers alert
priceAlertSchema.methods.checkPrice = function (currentPrice) {
  if (!this.isActive) return false;

  if (this.direction === "up") {
    return currentPrice >= this.targetPrice;
  } else if (this.direction === "down") {
    return currentPrice <= this.targetPrice;
  }

  return false;
};

// Static method to get user's active alerts
priceAlertSchema.statics.getActiveAlerts = function (userId) {
  return this.find({ user: userId, isActive: true })
    .populate("district", "name nameGuj")
    .populate("market", "name nameGuj")
    .populate("commodity", "name nameGuj img_url")
    .populate("variety", "name nameGuj")
    .populate("grade", "name nameGuj")
    .sort({ createdAt: -1 });
};

// Static method to get alerts for market-commodity (for cron job)
priceAlertSchema.statics.getAlertsForMarketCommodity = function (
  marketId,
  commodityId,
) {
  return this.find({
    market: marketId,
    commodity: commodityId,
    isActive: true,
  }).populate("user", "name mobileNumber");
};

module.exports = mongoose.model("PriceAlert", priceAlertSchema);
