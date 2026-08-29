const mongoose = require("mongoose");

// A notification shown in the app's notification centre (also the record of a
// push that was sent to the user).
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["price_alert", "scheme", "news", "weather", "general"],
      default: "general",
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    data: { type: Object, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
