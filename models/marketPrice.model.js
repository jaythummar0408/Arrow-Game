const mongoose = require("mongoose");

const marketPriceSchema = new mongoose.Schema(
  {
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: [true, "State reference is required"],
      index: true,
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: [true, "District reference is required"],
      index: true,
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      required: [true, "Market reference is required"],
      index: true,
    },
    commodity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commodity",
      required: [true, "Commodity reference is required"],
      index: true,
    },
    variety: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variety",
      required: [true, "Variety reference is required"],
      index: true,
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: [true, "Grade reference is required"],
      index: true,
    },
    arrival_date: {
      type: Date,
      required: [true, "Arrival date is required"],
      index: true,
    },
    min_price: {
      type: Number,
      required: [true, "Minimum price is required"],
      min: [0, "Minimum price cannot be negative"],
    },
    max_price: {
      type: Number,
      required: [true, "Maximum price is required"],
      min: [0, "Maximum price cannot be negative"],
    },
    modal_price: {
      type: Number,
      required: [true, "Modal price is required"],
      min: [0, "Modal price cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for faster queries
marketPriceSchema.index({ state: 1, arrival_date: -1 });
marketPriceSchema.index({ district: 1, arrival_date: -1 });
marketPriceSchema.index({ market: 1, arrival_date: -1 });
marketPriceSchema.index({ commodity: 1, arrival_date: -1 });
marketPriceSchema.index({ state: 1, commodity: 1, arrival_date: -1 });
marketPriceSchema.index({ market: 1, commodity: 1, arrival_date: -1 });

// Unique constraint to prevent duplicate entries
marketPriceSchema.index(
  {
    market: 1,
    commodity: 1,
    variety: 1,
    grade: 1,
    arrival_date: 1,
  },
  { unique: true },
);

module.exports = mongoose.model("MarketPrice", marketPriceSchema);
