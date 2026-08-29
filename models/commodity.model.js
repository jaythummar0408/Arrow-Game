const mongoose = require("mongoose");

const commoditySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Commodity name is required"],
      trim: true,
    },
    name_gj: {
      type: String,
      trim: true,
    },
    commodity_code: {
      type: Number,
      required: false, // Optional: will be backfilled from nightly sync
      sparse: true, // Allows multiple null values but unique non-null values
      unique: true, // Unique when not null
      default: null,
    },
    img_url: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
commoditySchema.index({ name: 1 });

module.exports = mongoose.model("Commodity", commoditySchema);
