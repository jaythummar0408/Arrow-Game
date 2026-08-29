const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Market name is required"],
      trim: true,
    },
    name_gj: {
      type: String,
      trim: true,
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: [true, "District reference is required"],
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: [true, "State reference is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for unique market within a district
marketSchema.index({ name: 1, district: 1 }, { unique: true });

// Index for state-based queries
marketSchema.index({ state: 1 });

module.exports = mongoose.model("Market", marketSchema);
