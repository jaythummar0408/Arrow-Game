const mongoose = require("mongoose");

// A localized string stored in English, Hindi and Gujarati.
const localizedSchema = new mongoose.Schema(
  {
    en: { type: String, default: "" },
    hi: { type: String, default: "" },
    gu: { type: String, default: "" },
  },
  { _id: false },
);

const newsSchema = new mongoose.Schema(
  {
    // "yojana" = Sarkari Yojana (schemes), "samachar" = Khedut Samachar (news)
    section: {
      type: String,
      enum: ["yojana", "samachar"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["scheme", "weather", "market", "tip", "general"],
      default: "general",
    },
    source: { type: String, default: "" },
    url: { type: String, default: "" },
    imageUrl: { type: String, default: "" }, // article thumbnail/photo
    publishedAt: { type: Date, default: Date.now, index: true },

    // Localized content
    title: { type: localizedSchema, required: true },
    summary: { type: localizedSchema, default: () => ({}) },
    body: { type: localizedSchema, default: () => ({}) },

    // De-dup key for items ingested from a news source (url hash / external id)
    externalId: { type: String, index: true, sparse: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Newest active items per section
newsSchema.index({ section: 1, isActive: 1, publishedAt: -1 });

module.exports = mongoose.model("News", newsSchema);
