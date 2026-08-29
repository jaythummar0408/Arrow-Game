const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Grade name is required"],
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

module.exports = mongoose.model("Grade", gradeSchema);
