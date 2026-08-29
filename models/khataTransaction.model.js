const mongoose = require("mongoose");

const EXPENSE_CATEGORIES = [
  "seed",
  "fertilizer",
  "pesticide",
  "tractor",
  "diesel",
  "labour",
  "irrigation",
  "transport",
  "harvesting",
  "equipment",
  "rent",
  "loan",
  "other",
];

const INCOME_CATEGORIES = [
  "cropSale",
  "dairySale",
  "livestock",
  "subsidy",
  "rental",
  "labourWork",
  "other",
];

const khataTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["expense", "income"],
        message: "Type must be either 'expense' or 'income'",
      },
      required: [true, "Transaction type is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      validate: {
        validator: function (value) {
          if (this.type === "expense") {
            return EXPENSE_CATEGORIES.includes(value);
          }
          if (this.type === "income") {
            return INCOME_CATEGORIES.includes(value);
          }
          return false;
        },
        message: "Invalid category for the given transaction type",
      },
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fast user-scoped filtered queries
khataTransactionSchema.index({ userId: 1, type: 1, date: -1 });
khataTransactionSchema.index({ userId: 1, date: -1 });

// Static: get valid categories for a type
khataTransactionSchema.statics.getCategories = function (type) {
  if (type === "expense") return EXPENSE_CATEGORIES;
  if (type === "income") return INCOME_CATEGORIES;
  return [];
};

module.exports = mongoose.model("KhataTransaction", khataTransactionSchema);
