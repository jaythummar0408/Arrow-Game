const mongoose = require("mongoose");

const MACHINES = [
  "Rotavator",
  "Plough",
  "Cultivator",
  "SeedDrill",
  "Harrow",
  "Ridger",
  "Leveler",
  "Sprayer",
  "Trolley",
  "Other",
];

const RATE_TYPES = ["acre", "bigha", "hour"];
const PAYMENT_STATUSES = ["paid", "partial", "pending"];

const tractorWorkSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TractorCustomer",
      required: [true, "Customer ID is required"],
      index: true,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerMobile: {
      type: String,
      required: [true, "Customer mobile is required"],
      trim: true,
    },
    village: {
      type: String,
      required: [true, "Village is required"],
      trim: true,
    },
    machine: {
      type: String,
      required: [true, "Machine type is required"],
      enum: {
        values: MACHINES,
        message: "Invalid machine type",
      },
    },
    areaOrHours: {
      type: Number,
      required: [true, "Area or hours is required"],
      min: [0.01, "Must be greater than 0"],
    },
    rateType: {
      type: String,
      required: [true, "Rate type is required"],
      enum: {
        values: RATE_TYPES,
        message: "Rate type must be acre, bigha, or hour",
      },
    },
    rate: {
      type: Number,
      required: [true, "Rate is required"],
      min: [0, "Rate must be non-negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total must be non-negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount must be non-negative"],
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: [0, "Pending amount must be non-negative"],
    },
    paymentStatus: {
      type: String,
      required: [true, "Payment status is required"],
      enum: {
        values: PAYMENT_STATUSES,
        message: "Payment status must be paid, partial, or pending",
      },
    },
    workDate: {
      type: Date,
      required: [true, "Work date is required"],
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
      default: "",
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast queries
tractorWorkSchema.index({ ownerId: 1, workDate: -1 });
tractorWorkSchema.index({ ownerId: 1, customerId: 1, workDate: -1 });

module.exports = mongoose.model("TractorWork", tractorWorkSchema);
