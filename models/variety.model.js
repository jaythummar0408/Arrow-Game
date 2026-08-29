const mongoose = require("mongoose");

const varietySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Variety name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    name_gj: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Variety", varietySchema);
