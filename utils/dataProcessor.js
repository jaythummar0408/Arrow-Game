const {
  State,
  District,
  Market,
  Commodity,
  Variety,
  Grade,
  MarketPrice,
} = require("../models");
const { getCommodityGujaratiName } = require("./translate");

/**
 * Get or Create State
 * @param {string} stateName - State name
 * @returns {Promise<Object>} State document
 */
const getOrCreateState = async (stateName) => {
  try {
    let state = await State.findOne({ name: stateName });
    if (!state) {
      // States are proper nouns - no translation needed
      state = await State.create({
        name: stateName,
        name_gj: null, // Will be updated manually if needed
      });
      console.log(`✅ Created new state: ${stateName}`);
    }
    return state;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await State.findOne({ name: stateName });
    }
    throw error;
  }
};

/**
 * Get or Create District
 * @param {string} districtName - District name
 * @param {string} stateId - State ObjectId
 * @returns {Promise<Object>} District document
 */
const getOrCreateDistrict = async (districtName, stateId) => {
  try {
    let district = await District.findOne({
      name: districtName,
      state: stateId,
    });
    if (!district) {
      // Districts are proper nouns - no translation needed
      district = await District.create({
        name: districtName,
        name_gj: null, // Will be updated manually if needed
        state: stateId,
      });
      console.log(`✅ Created new district: ${districtName}`);
    }
    return district;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await District.findOne({ name: districtName, state: stateId });
    }
    throw error;
  }
};

/**
 * Get or Create Market
 * @param {string} marketName - Market name
 * @param {string} districtId - District ObjectId
 * @param {string} stateId - State ObjectId
 * @returns {Promise<Object>} Market document
 */
const getOrCreateMarket = async (marketName, districtId, stateId) => {
  try {
    let market = await Market.findOne({
      name: marketName,
      district: districtId,
    });
    if (!market) {
      // Markets are proper nouns - no translation needed
      market = await Market.create({
        name: marketName,
        name_gj: null, // Will be updated manually if needed
        district: districtId,
        state: stateId,
      });
      console.log(`✅ Created new market: ${marketName}`);
    }
    return market;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await Market.findOne({ name: marketName, district: districtId });
    }
    throw error;
  }
};

/**
 * Get or Create Commodity
 * @param {string} commodityName - Commodity name
 * @param {number|null} commodityCode - Commodity code (optional for hourly sync)
 * @returns {Promise<Object>} Commodity document
 */
const getOrCreateCommodity = async (commodityName, commodityCode = null) => {
  try {
    let commodity = null;

    // Strategy 1: If commodity_code provided, try to find by code first
    if (commodityCode !== null && commodityCode !== undefined) {
      commodity = await Commodity.findOne({ commodity_code: commodityCode });
    }

    // Strategy 2: If not found by code, try to find by name
    if (!commodity) {
      commodity = await Commodity.findOne({ name: commodityName });
    }

    // Strategy 3: If still not found, create new commodity
    if (!commodity) {
      // Get Gujarati name (with fallback)
      let gujaratiName = null;
      try {
        gujaratiName = await getCommodityGujaratiName(commodityName);
      } catch (error) {
        console.log(`⚠️  Translation skipped for: ${commodityName}`);
      }

      commodity = await Commodity.create({
        name: commodityName,
        name_gj: gujaratiName,
        commodity_code: commodityCode, // Can be null for hourly sync
      });

      if (gujaratiName && commodityCode) {
        console.log(
          `✅ Created new commodity: ${commodityName} (${gujaratiName}) [${commodityCode}]`,
        );
      } else if (gujaratiName) {
        console.log(
          `✅ Created new commodity: ${commodityName} (${gujaratiName}) [code: pending]`,
        );
      } else if (commodityCode) {
        console.log(
          `✅ Created new commodity: ${commodityName} [${commodityCode}]`,
        );
      } else {
        console.log(
          `✅ Created new commodity: ${commodityName} [code: pending]`,
        );
      }
    } else if (
      commodityCode &&
      (!commodity.commodity_code || commodity.commodity_code === null)
    ) {
      // Update existing commodity with newly provided code
      commodity.commodity_code = commodityCode;
      await commodity.save();
      console.log(
        `✅ Updated commodity code: ${commodityName} [${commodityCode}]`,
      );
    }

    return commodity;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      // Try to find by name or code
      if (commodityCode) {
        const existing = await Commodity.findOne({
          commodity_code: commodityCode,
        });
        if (existing) return existing;
      }
      const existing = await Commodity.findOne({ name: commodityName });
      if (existing) return existing;
    }
    throw error;
  }
};

/**
 * Get or Create Variety
 * @param {string} varietyName - Variety name
 * @returns {Promise<Object>} Variety document
 */
const getOrCreateVariety = async (varietyName) => {
  try {
    let variety = await Variety.findOne({ name: varietyName });
    if (!variety) {
      // Get Gujarati name (with fallback)
      let gujaratiName = null;
      try {
        gujaratiName = await getCommodityGujaratiName(varietyName);
      } catch (error) {
        console.log(`⚠️  Translation skipped for variety: ${varietyName}`);
      }

      variety = await Variety.create({
        name: varietyName,
        name_gj: gujaratiName,
      });

      if (gujaratiName) {
        console.log(`✅ Created new variety: ${varietyName} (${gujaratiName})`);
      } else {
        console.log(`✅ Created new variety: ${varietyName}`);
      }
    }
    return variety;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await Variety.findOne({ name: varietyName });
    }
    throw error;
  }
};

/**
 * Get or Create Grade
 * @param {string} gradeName - Grade name
 * @returns {Promise<Object>} Grade document
 */
const getOrCreateGrade = async (gradeName) => {
  try {
    let grade = await Grade.findOne({ name: gradeName });
    if (!grade) {
      // Get Gujarati name (with fallback)
      let gujaratiName = null;
      try {
        gujaratiName = await getCommodityGujaratiName(gradeName);
      } catch (error) {
        console.log(`⚠️  Translation skipped for grade: ${gradeName}`);
      }

      grade = await Grade.create({
        name: gradeName,
        name_gj: gujaratiName,
      });

      if (gujaratiName) {
        console.log(`✅ Created new grade: ${gradeName} (${gujaratiName})`);
      } else {
        console.log(`✅ Created new grade: ${gradeName}`);
      }
    }
    return grade;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await Grade.findOne({ name: gradeName });
    }
    throw error;
  }
};

/**
 * Parse date from DD/MM/YYYY to Date object
 * @param {string} dateStr - Date string in DD/MM/YYYY format
 * @returns {Date} Date object
 * @throws {Error} If date string is invalid or missing
 */
const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") {
    throw new Error(`Invalid date string: ${dateStr}`);
  }

  const parts = dateStr.split("/");
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateStr}. Expected DD/MM/YYYY`);
  }

  const [day, month, year] = parts;

  // Validate date components
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
    throw new Error(`Invalid date components in: ${dateStr}`);
  }

  if (
    dayNum < 1 ||
    dayNum > 31 ||
    monthNum < 1 ||
    monthNum > 12 ||
    yearNum < 1900
  ) {
    throw new Error(`Date out of valid range: ${dateStr}`);
  }

  const date = new Date(`${year}-${month}-${day}`);

  if (isNaN(date.getTime())) {
    throw new Error(`Could not create valid date from: ${dateStr}`);
  }

  return date;
};

/**
 * Normalize record field names to match expected format
 * Handles both lowercase (from API) and capitalized (legacy) field names
 * @param {Object} record - Raw record from API
 * @returns {Object} Normalized record with capitalized field names
 */
const normalizeRecordFields = (record) => {
  const normalized = {};

  // Map lowercase to capitalized field names
  const fieldMapping = {
    state: "State",
    district: "District",
    market: "Market",
    commodity: "Commodity",
    variety: "Variety",
    grade: "Grade",
    arrival_date: "Arrival_Date",
    min_price: "Min_Price",
    max_price: "Max_Price",
    modal_price: "Modal_Price",
    commodity_code: "Commodity_Code",
  };

  // Copy all fields from original record
  for (const key in record) {
    normalized[key] = record[key];
  }

  // Apply field mapping (lowercase -> capitalized)
  for (const [lowercase, capitalized] of Object.entries(fieldMapping)) {
    if (record[lowercase] !== undefined && !record[capitalized]) {
      normalized[capitalized] = record[lowercase];
    }
  }

  return normalized;
};

/**
 * Process and save a single price record
 * @param {Object} record - Price record from API
 * @returns {Promise<Object>} Result object
 */
const processPriceRecord = async (record) => {
  // Normalize field names first
  const normalizedRecord = normalizeRecordFields(record);
  record = normalizedRecord;
  try {
    // Validate required fields
    const requiredFields = [
      "State",
      "District",
      "Market",
      "Commodity",
      "Variety",
      "Grade",
      "Arrival_Date",
      "Min_Price",
      "Max_Price",
      "Modal_Price",
    ];
    const missingFields = requiredFields.filter(
      (field) => !record[field] && record[field] !== 0,
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Step 1: Get or create all related entities
    const state = await getOrCreateState(record.State);
    const district = await getOrCreateDistrict(record.District, state._id);
    const market = await getOrCreateMarket(
      record.Market,
      district._id,
      state._id,
    );
    const commodity = await getOrCreateCommodity(
      record.Commodity,
      record.Commodity_Code,
    );
    const variety = await getOrCreateVariety(record.Variety);
    const grade = await getOrCreateGrade(record.Grade);

    // Step 2: Parse arrival date
    const arrivalDate = parseDate(record.Arrival_Date);

    // Step 3: Check if price record already exists
    const existingPrice = await MarketPrice.findOne({
      market: market._id,
      commodity: commodity._id,
      variety: variety._id,
      grade: grade._id,
      arrival_date: arrivalDate,
    });

    if (existingPrice) {
      // Update existing record
      existingPrice.min_price = record.Min_Price;
      existingPrice.max_price = record.Max_Price;
      existingPrice.modal_price = record.Modal_Price;
      await existingPrice.save();
      return { status: "updated", record: existingPrice };
    } else {
      // Create new price record
      const priceRecord = await MarketPrice.create({
        state: state._id,
        district: district._id,
        market: market._id,
        commodity: commodity._id,
        variety: variety._id,
        grade: grade._id,
        arrival_date: arrivalDate,
        min_price: record.Min_Price,
        max_price: record.Max_Price,
        modal_price: record.Modal_Price,
      });
      return { status: "created", record: priceRecord };
    }
  } catch (error) {
    console.error("Error processing record:", error.message);
    console.error("Problematic record:", JSON.stringify(record, null, 2));
    return { status: "error", error: error.message, record };
  }
};

/**
 * Process multiple price records in batch
 * @param {Array} records - Array of price records
 * @returns {Promise<Object>} Summary of processing
 */
const processPriceRecordsBatch = async (records) => {
  const results = {
    total: records.length,
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [],
  };

  for (const record of records) {
    const result = await processPriceRecord(record);
    if (result.status === "created") {
      results.created++;
    } else if (result.status === "updated") {
      results.updated++;
    } else if (result.status === "error") {
      results.errors++;
      results.errorDetails.push({
        record: record,
        error: result.error,
      });
    }
  }

  return results;
};

/**
 * Process and save a single daily price record (without commodity_code)
 * Used for hourly sync of today's data from Daily API
 * @param {Object} record - Price record from Daily API
 * @returns {Promise<Object>} Result object
 */
const processDailyPriceRecord = async (record) => {
  try {
    // Normalize field names first
    const normalizedRecord = normalizeRecordFields(record);
    record = normalizedRecord;

    // Validate required fields
    const requiredFields = [
      "State",
      "District",
      "Market",
      "Commodity",
      "Variety",
      "Grade",
      "Arrival_Date",
      "Min_Price",
      "Max_Price",
      "Modal_Price",
    ];
    const missingFields = requiredFields.filter(
      (field) => !record[field] && record[field] !== 0,
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Step 1: Get or create all related entities
    const state = await getOrCreateState(record.State);
    const district = await getOrCreateDistrict(record.District, state._id);
    const market = await getOrCreateMarket(
      record.Market,
      district._id,
      state._id,
    );
    // For daily API, we don't have Commodity_Code, so pass null
    const commodity = await getOrCreateCommodity(record.Commodity, null);
    const variety = await getOrCreateVariety(record.Variety);
    const grade = await getOrCreateGrade(record.Grade);

    // Step 2: Parse arrival date
    const arrivalDate = parseDate(record.Arrival_Date);

    // Step 3: Check if price record already exists
    const existingPrice = await MarketPrice.findOne({
      market: market._id,
      commodity: commodity._id,
      variety: variety._id,
      grade: grade._id,
      arrival_date: arrivalDate,
    });

    if (existingPrice) {
      // Update existing record
      existingPrice.min_price = record.Min_Price;
      existingPrice.max_price = record.Max_Price;
      existingPrice.modal_price = record.Modal_Price;
      await existingPrice.save();
      return { status: "updated", record: existingPrice };
    } else {
      // Create new price record
      const priceRecord = await MarketPrice.create({
        state: state._id,
        district: district._id,
        market: market._id,
        commodity: commodity._id,
        variety: variety._id,
        grade: grade._id,
        arrival_date: arrivalDate,
        min_price: record.Min_Price,
        max_price: record.Max_Price,
        modal_price: record.Modal_Price,
      });
      return { status: "created", record: priceRecord };
    }
  } catch (error) {
    console.error("Error processing daily record:", error.message);
    console.error("Problematic record:", JSON.stringify(record, null, 2));
    return { status: "error", error: error.message, record };
  }
};

/**
 * Process multiple daily price records in batch
 * @param {Array} records - Array of daily price records
 * @returns {Promise<Object>} Summary of processing
 */
const processDailyPriceRecordsBatch = async (records) => {
  const results = {
    total: records.length,
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [],
  };

  for (const record of records) {
    const result = await processDailyPriceRecord(record);
    if (result.status === "created") {
      results.created++;
    } else if (result.status === "updated") {
      results.updated++;
    } else if (result.status === "error") {
      results.errors++;
      results.errorDetails.push({
        record: record,
        error: result.error,
      });
    }
  }

  return results;
};

/**
 * Backfill commodity codes from historical data
 * This runs during nightly sync to update commodities that don't have codes yet
 * @param {Array} records - Array of records with Commodity_Code from Historical API
 * @returns {Promise<Object>} Summary of backfill operation
 */
const backfillCommodityCodes = async (records) => {
  const results = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  // Create a map of commodity names to codes from the records
  const commodityCodeMap = new Map();

  for (const record of records) {
    if (record.Commodity && record.Commodity_Code) {
      // Use the record with highest code if duplicate names exist
      const existingCode = commodityCodeMap.get(record.Commodity);
      if (!existingCode || record.Commodity_Code > existingCode) {
        commodityCodeMap.set(record.Commodity, record.Commodity_Code);
      }
    }
  }

  results.total = commodityCodeMap.size;
  console.log(
    `\n🔄 Starting commodity code backfill: ${results.total} unique commodities found`,
  );

  for (const [commodityName, commodityCode] of commodityCodeMap) {
    try {
      // Find commodity by name that doesn't have a code yet
      const commodity = await Commodity.findOne({
        name: commodityName,
        $or: [{ commodity_code: null }, { commodity_code: { $exists: false } }],
      });

      if (commodity) {
        commodity.commodity_code = commodityCode;
        await commodity.save();
        results.updated++;
        console.log(
          `   ✅ Backfilled commodity code: ${commodityName} [${commodityCode}]`,
        );
      } else {
        // Either commodity doesn't exist or already has a code
        results.skipped++;
      }
    } catch (error) {
      results.errors++;
      results.errorDetails.push({
        commodity: commodityName,
        code: commodityCode,
        error: error.message,
      });
      console.error(
        `   ❌ Error backfilling ${commodityName}: ${error.message}`,
      );
    }
  }

  console.log(`\n✅ Backfill completed!`);
  console.log(`   Updated: ${results.updated}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Errors: ${results.errors}`);

  return results;
};

module.exports = {
  getOrCreateState,
  getOrCreateDistrict,
  getOrCreateMarket,
  getOrCreateCommodity,
  getOrCreateVariety,
  getOrCreateGrade,
  processPriceRecord,
  processPriceRecordsBatch,
  processDailyPriceRecord,
  processDailyPriceRecordsBatch,
  backfillCommodityCodes,
};
