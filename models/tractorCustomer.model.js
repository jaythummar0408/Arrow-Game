const mongoose = require("mongoose");

const tractorCustomerSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Mobile must be a valid 10-digit number"],
    },
    village: {
      type: String,
      required: [true, "Village is required"],
      trim: true,
      maxlength: [100, "Village cannot exceed 100 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one owner can't have duplicate name+mobile
tractorCustomerSchema.index({ ownerId: 1, name: 1, mobile: 1 }, { unique: true });

module.exports = mongoose.model("TractorCustomer", tractorCustomerSchema);
