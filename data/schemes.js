/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SARKARI YOJANA — Gujarat farmer schemes  (edit this file to manage them)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  • Written in ENGLISH — Gujarati is auto-translated when published.
 *  • Max 5 schemes are used (see MAX_SCHEMES in controllers/newsController.js).
 *  • The daily 6 AM job upserts these and keeps them fresh; removing one here
 *    lets it age out within the 7-day retention window.
 *
 *  Note on the source: pmkisan.gov.in is the portal for a SINGLE central
 *  scheme (PM-Kisan), not a list of Gujarat schemes, so it can't be scraped
 *  for five items. PM-Kisan below is sourced from it; the rest are the main
 *  Gujarat / central schemes farmers here actually use. Edit freely.
 */

module.exports = [
  {
    source: "PM-Kisan",
    url: "https://pmkisan.gov.in",
    title: "PM-Kisan Samman Nidhi — ₹6,000 a year",
    summary:
      "Eligible farmer families get ₹6,000 per year, paid directly to their bank account in three instalments.",
    body:
      "Under PM-Kisan Samman Nidhi, eligible farmer families receive ₹6,000 per year in three equal instalments of ₹2,000, transferred directly to their bank accounts. To check your status, open pmkisan.gov.in, go to Beneficiary Status and enter your registered mobile number or Aadhaar. If your name is missing, complete e-KYC and land verification at your nearest CSC or village office.",
  },
  {
    source: "PMFBY",
    url: "https://pmfby.gov.in",
    title: "Crop insurance (PMFBY) — enrol for the season",
    summary:
      "Insure your crop against drought, flood, pests and unseasonal rain for as little as 2% premium.",
    body:
      "Pradhan Mantri Fasal Bima Yojana (PMFBY) offers low-premium insurance against crop loss. Farmers pay just 2% of the sum insured for Kharif and 1.5% for Rabi crops. Enrol through your bank, a CSC or the National Crop Insurance Portal before the cut-off date with your land records, bank passbook and sowing certificate. In case of loss, report it within 72 hours to receive a timely claim.",
  },
  {
    source: "GGRC / PMKSY",
    url: "https://ggrc.co.in",
    title: "Up to 55% subsidy on drip & sprinkler sets",
    summary:
      "Micro-irrigation subsidy under PMKSY (Per Drop More Crop), managed in Gujarat by GGRC.",
    body:
      "Under Pradhan Mantri Krishi Sinchayee Yojana (Per Drop More Crop), Gujarat farmers can get 45–55% subsidy on drip and sprinkler irrigation systems, with small and marginal farmers getting the higher rate. Micro-irrigation cuts water use by up to 50% and raises yield. Apply through the Gujarat Green Revolution Company (GGRC) portal with your land record, bank details and a quotation from a registered supplier.",
  },
  {
    source: "Gujarat Govt",
    url: "https://ikhedut.gujarat.gov.in",
    title: "Mukhyamantri Kisan Sahay Yojana — crop-loss aid",
    summary:
      "Free Gujarat state cover that pays farmers for crop loss from drought, heavy rain or unseasonal rain.",
    body:
      "Mukhyamantri Kisan Sahay Yojana is a Gujarat state scheme that compensates farmers for crop loss caused by drought, excessive rainfall or unseasonal rain — with no premium to pay. Assistance is paid per hectare based on the assessed loss, up to a fixed limit per farmer. Register your land and bank details on the i-Khedut portal; when a calamity is declared, apply within the notified window to receive support.",
  },
  {
    source: "i-Khedut",
    url: "https://ikhedut.gujarat.gov.in",
    title: "i-Khedut — subsidy on farm equipment",
    summary:
      "Apply on Gujarat's i-Khedut portal for subsidy on tractors, implements and farm machinery.",
    body:
      "The Gujarat i-Khedut portal lists agriculture, horticulture and animal-husbandry schemes with subsidy on tractors, power tillers, rotavators, sprayers and other implements. Subsidy rates are higher for small, marginal, SC/ST and women farmers. Open ikhedut.gujarat.gov.in, choose the scheme, and apply with your Aadhaar, land record (7/12) and bank details during the open application window for your district.",
  },
];
