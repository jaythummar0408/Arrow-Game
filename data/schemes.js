/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SARKARI YOJANA — Gujarat / central farmer schemes  (edit this file freely)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  • Written in ENGLISH — Gujarati is auto-translated when published.
 *  • ALL entries here are published (no cap). The daily job upserts them and
 *    keeps them fresh; schemes show for 30 days (see SCHEME_RETENTION_DAYS),
 *    and because they're refreshed daily they never age out.
 *  • `image` is an article photo shown on the card. We use Wikimedia Commons
 *    `Special:FilePath/<File>` URLs (stable, hotlink-friendly). Leave `image`
 *    empty ("") to fall back to the branded gradient tile.
 */

// Scheme images are hosted on the app's Cloudinary CDN (serves any client,
// unlike Wikimedia which 403s non-browser user-agents). Source photos came
// from Wikimedia Commons; uploaded to the apmc_schemes folder.
const CLOUDINARY = "https://res.cloudinary.com/djzu5hn0r/image/upload/apmc_schemes";
const IMG_KEY = {
  "Indian farmer.jpg": "farmer",
  "Paddy field.jpg": "paddy",
  "Drip irrigation.jpg": "drip",
  "Cotton field.jpg": "cotton",
  "Farmer plowing.jpg": "plowing",
  "Wheat field.jpg": "wheat",
  "Soil testing.jpg": "soil",
  "Solar panel.jpg": "solar",
  "Maize field.jpg": "maize",
  "Sugarcane field.jpg": "sugarcane",
  "Groundnut.jpg": "groundnut",
};
const img = (file) => `${CLOUDINARY}/${IMG_KEY[file] || "farmer"}.jpg`;

module.exports = [
  {
    source: "PM-Kisan",
    url: "https://pmkisan.gov.in",
    image: img("Indian farmer.jpg"),
    title: "PM-Kisan Samman Nidhi — ₹6,000 a year",
    summary:
      "Eligible farmer families get ₹6,000 per year, paid directly to their bank account in three instalments.",
    body:
      "Under PM-Kisan Samman Nidhi, eligible farmer families receive ₹6,000 per year in three equal instalments of ₹2,000, transferred directly to their bank accounts. To check your status, open pmkisan.gov.in, go to Beneficiary Status and enter your registered mobile number or Aadhaar. If your name is missing, complete e-KYC and land verification at your nearest CSC or village office.",
  },
  {
    source: "PMFBY",
    url: "https://pmfby.gov.in",
    image: img("Paddy field.jpg"),
    title: "Crop insurance (PMFBY) — enrol for the season",
    summary:
      "Insure your crop against drought, flood, pests and unseasonal rain for as little as 2% premium.",
    body:
      "Pradhan Mantri Fasal Bima Yojana (PMFBY) offers low-premium insurance against crop loss. Farmers pay just 2% of the sum insured for Kharif and 1.5% for Rabi crops. Enrol through your bank, a CSC or the National Crop Insurance Portal before the cut-off date with your land records, bank passbook and sowing certificate. In case of loss, report it within 72 hours to receive a timely claim.",
  },
  {
    source: "GGRC / PMKSY",
    url: "https://ggrc.co.in",
    image: img("Drip irrigation.jpg"),
    title: "Up to 55% subsidy on drip & sprinkler sets",
    summary:
      "Micro-irrigation subsidy under PMKSY (Per Drop More Crop), managed in Gujarat by GGRC.",
    body:
      "Under Pradhan Mantri Krishi Sinchayee Yojana (Per Drop More Crop), Gujarat farmers can get 45–55% subsidy on drip and sprinkler irrigation systems, with small and marginal farmers getting the higher rate. Micro-irrigation cuts water use by up to 50% and raises yield. Apply through the Gujarat Green Revolution Company (GGRC) portal with your land record, bank details and a quotation from a registered supplier.",
  },
  {
    source: "Gujarat Govt",
    url: "https://ikhedut.gujarat.gov.in",
    image: img("Cotton field.jpg"),
    title: "Mukhyamantri Kisan Sahay Yojana — crop-loss aid",
    summary:
      "Free Gujarat state cover that pays farmers for crop loss from drought, heavy rain or unseasonal rain.",
    body:
      "Mukhyamantri Kisan Sahay Yojana is a Gujarat state scheme that compensates farmers for crop loss caused by drought, excessive rainfall or unseasonal rain — with no premium to pay. Assistance is paid per hectare based on the assessed loss, up to a fixed limit per farmer. Register your land and bank details on the i-Khedut portal; when a calamity is declared, apply within the notified window to receive support.",
  },
  {
    source: "i-Khedut",
    url: "https://ikhedut.gujarat.gov.in",
    image: img("Farmer plowing.jpg"),
    title: "i-Khedut — subsidy on farm equipment",
    summary:
      "Apply on Gujarat's i-Khedut portal for subsidy on tractors, implements and farm machinery.",
    body:
      "The Gujarat i-Khedut portal lists agriculture, horticulture and animal-husbandry schemes with subsidy on tractors, power tillers, rotavators, sprayers and other implements. Subsidy rates are higher for small, marginal, SC/ST and women farmers. Open ikhedut.gujarat.gov.in, choose the scheme, and apply with your Aadhaar, land record (7/12) and bank details during the open application window for your district.",
  },
  {
    source: "KCC",
    url: "https://pmkisan.gov.in/Documents/KCC.pdf",
    image: img("Wheat field.jpg"),
    title: "Kisan Credit Card — crop loans at 4%",
    summary:
      "Short-term crop loans up to ₹3 lakh at an effective 4% interest when you repay on time.",
    body:
      "The Kisan Credit Card (KCC) gives farmers easy short-term credit for seeds, fertiliser and other inputs — up to ₹3 lakh at 7% interest, reduced to an effective 4% with timely repayment. It also covers animal husbandry and fisheries. Apply at your bank or through the PM-Kisan portal with your land record, Aadhaar and a passport photo; existing PM-Kisan beneficiaries can get a KCC with minimal paperwork.",
  },
  {
    source: "Soil Health Card",
    url: "https://soilhealth.dac.gov.in",
    image: img("Soil testing.jpg"),
    title: "Soil Health Card — free soil testing",
    summary:
      "Get your soil tested free and receive crop-wise fertiliser recommendations every two years.",
    body:
      "Under the Soil Health Card scheme, farmers get their soil tested free of cost and receive a card showing nutrient status (N, P, K), pH and micronutrients, with crop-wise fertiliser recommendations. Using only what your soil needs cuts input cost and improves yield. Collect samples from several points in the field, mix them, and submit about half a kilogram at your nearest KVK or soil-testing lab, or ask your village extension officer.",
  },
  {
    source: "PM-KUSUM",
    url: "https://pmkusum.mnre.gov.in",
    image: img("Solar panel.jpg"),
    title: "PM-KUSUM — subsidy on solar pumps",
    summary:
      "Up to 60% subsidy to install solar irrigation pumps and cut diesel and electricity bills.",
    body:
      "Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM) helps farmers install solar-powered irrigation pumps with up to 60% combined central and state subsidy, plus a bank loan for most of the rest. Solar pumps remove diesel cost and give reliable daytime irrigation; under some components you can sell surplus power to the grid. Apply through your state nodal agency or the i-Khedut portal with your land and bank details.",
  },
  {
    source: "e-NAM",
    url: "https://enam.gov.in",
    image: img("Maize field.jpg"),
    title: "e-NAM — sell in the national online mandi",
    summary:
      "Trade your produce on the electronic National Agriculture Market for better price discovery.",
    body:
      "e-NAM (National Agriculture Market) links APMC mandis across India into one online trading platform so you can reach more buyers and get transparent, competitive prices. Produce is lot-assayed for quality, buyers bid online, and payment is made directly to your account. Register free at your e-NAM-enabled mandi with your Aadhaar and bank details, or on enam.gov.in, and bring your produce to the mandi for assaying.",
  },
  {
    source: "SMAM",
    url: "https://agrimachinery.nic.in",
    image: img("Farmer plowing.jpg"),
    title: "Farm machinery subsidy (SMAM)",
    summary:
      "40–50% subsidy on tractors, implements and Custom Hiring Centres for machinery.",
    body:
      "The Sub-Mission on Agricultural Mechanization (SMAM) gives 40–50% subsidy on tractors, power tillers, rotavators, harvesters and other implements, with higher rates for small, marginal, SC/ST and women farmers. It also funds Custom Hiring Centres and Farm Machinery Banks so you can rent costly machines cheaply. Apply on the agrimachinery.nic.in (FARMER) portal or Gujarat's i-Khedut with your Aadhaar, land record and bank details.",
  },
  {
    source: "PM-KMY",
    url: "https://maandhan.in",
    image: img("Indian farmer.jpg"),
    title: "PM Kisan Maandhan — ₹3,000 monthly pension",
    summary:
      "A pension of ₹3,000 a month after age 60 for small and marginal farmers.",
    body:
      "Pradhan Mantri Kisan Maandhan Yojana (PM-KMY) is a voluntary pension scheme for small and marginal farmers aged 18–40. You contribute ₹55–₹200 a month (the government matches it) and receive ₹3,000 per month after turning 60. PM-Kisan beneficiaries can pay the contribution directly from their benefit. Enrol at a CSC with your Aadhaar and bank details.",
  },
  {
    source: "PKVY",
    url: "https://pgsindia-ncof.gov.in",
    image: img("Sugarcane field.jpg"),
    title: "Organic farming support (PKVY)",
    summary:
      "About ₹31,500 per hectare over three years to switch to certified organic farming.",
    body:
      "Paramparagat Krishi Vikas Yojana (PKVY) promotes chemical-free, certified organic farming through cluster groups. Farmers get about ₹31,500 per hectare over three years for inputs, training and certification, plus help marketing organic produce at a premium. Join a local cluster (about 50 farmers / 50 acres) through your agriculture department or FPO to enrol.",
  },
  {
    source: "AIF",
    url: "https://agriinfra.dac.gov.in",
    image: img("Wheat field.jpg"),
    title: "Agri Infrastructure Fund — loans for storage",
    summary:
      "Low-interest loans with 3% interest subvention to build warehouses, cold storage and processing units.",
    body:
      "The Agriculture Infrastructure Fund (AIF) offers medium- and long-term loans to build post-harvest infrastructure — warehouses, cold storage, grading and sorting units, primary processing and more — with a 3% interest subvention for up to 7 years and a credit guarantee on loans up to ₹2 crore. Farmers, FPOs, PACS and agri-entrepreneurs can apply online at agriinfra.dac.gov.in with a project report and land/bank details.",
  },
  {
    source: "Agri Drone",
    url: "https://agrimachinery.nic.in",
    image: img("Maize field.jpg"),
    title: "Kisan Drone — subsidy for drone spraying",
    summary:
      "Subsidy of 40–100% for drones and drone services to spray fertiliser and pesticide.",
    body:
      "Under the agricultural mechanization scheme, farmers, FPOs and Custom Hiring Centres get large subsidies on Kisan Drones used to spray fertiliser, nano-urea and pesticides — up to 100% (max ₹10 lakh) for farm institutions like KVKs, and 40–75% for FPOs and individual buyers. Drones save labour and chemicals and give even coverage. Apply through the agri-machinery portal or your state agriculture department.",
  },
  {
    source: "NLM",
    url: "https://nlm.udyamimitra.in",
    image: img("Groundnut.jpg"),
    title: "National Livestock Mission — dairy & goat subsidy",
    summary:
      "50% capital subsidy to start poultry, goat, sheep or piggery units for extra farm income.",
    body:
      "The National Livestock Mission (NLM) gives a 50% capital subsidy (up to fixed ceilings) to set up poultry, goat, sheep, piggery and fodder units, helping farmers add a steady income alongside crops. Individual farmers, SHGs, FPOs and companies can apply online with a project proposal, land/shed details and bank information through the NLM portal or your district animal husbandry office.",
  },
];
