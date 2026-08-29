const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "District name is required"],
      trim: true,
    },
    name_gj: {
      type: String,
      trim: true,
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

// Compound index for unique district within a state
districtSchema.index({ name: 1, state: 1 }, { unique: true });

module.exports = mongoose.model("District", districtSchema);
