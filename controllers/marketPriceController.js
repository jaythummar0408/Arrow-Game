const { default: mongoose } = require("mongoose");
const {
  MarketPrice,
  State,
  District,
  Market,
  Commodity,
  Variety,
  Grade,
} = require("../models");

/**
 * Get Market Prices with Advanced Filtering
 * @route GET /api/v1/market-prices
 * @access Public
 */
exports.getMarketPrices = async (req, res) => {
  try {
    const {
      // Date filters
      days = 30, // Default: last 30 days (7, 15, 30)
      startDate,
      endDate,

      // Location filters
      state,
      district,
      market,

      // Commodity filters
      commodity,
      commodityCode,
      variety,
      grade,

      // Price filters
      minPrice,
      maxPrice,

      // Sorting
      sortBy = "arrival_date", // arrival_date, modal_price, min_price, max_price
      sortOrder = "desc", // asc, desc

      // Pagination
      page = 1,
      limit = 50,

      // Populate options
      populate = "true", // true, false
    } = req.query;

    // Build query
    const query = {};

    // Date Range Filter
    if (startDate && endDate) {
      // Custom date range
      query.arrival_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Last N days (excluding today)
      const daysCount = parseInt(days) || 30;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endDateCalc = new Date(today);
      endDateCalc.setDate(today.getDate() - 1); // Yesterday

      const startDateCalc = new Date(today);
      startDateCalc.setDate(today.getDate() - daysCount); // N days ago

      query.arrival_date = {
        $gte: startDateCalc,
        $lte: endDateCalc,
      };
    }

    // Find referenced IDs for filters
    if (state) {
      const stateDoc = await State.findOne({ name: new RegExp(state, "i") });
      if (stateDoc) query.state = stateDoc._id;
    }

    if (district) {
      const districtDoc = await District.findOne({
        name: new RegExp(district, "i"),
      });
      if (districtDoc) query.district = districtDoc._id;
    }

    if (market) {
      const marketDoc = await Market.findOne({ name: new RegExp(market, "i") });
      if (marketDoc) query.market = marketDoc._id;
    }

    if (commodity) {
      const commodityDoc = await Commodity.findOne({
        name: new RegExp(commodity, "i"),
      });
      if (commodityDoc) query.commodity = commodityDoc._id;
    }

    if (commodityCode) {
      const commodityDoc = await Commodity.findOne({
        commodity_code: parseInt(commodityCode),
      });
      if (commodityDoc) query.commodity = commodityDoc._id;
    }

    if (variety) {
      const varietyDoc = await Variety.findOne({
        name: new RegExp(variety, "i"),
      });
      if (varietyDoc) query.variety = varietyDoc._id;
    }

    if (grade) {
      const gradeDoc = await Grade.findOne({ name: new RegExp(grade, "i") });
      if (gradeDoc) query.grade = gradeDoc._id;
    }

    // Price Range Filter
    if (minPrice || maxPrice) {
      query.modal_price = {};
      if (minPrice) query.modal_price.$gte = parseInt(minPrice);
      if (maxPrice) query.modal_price.$lte = parseInt(maxPrice);
    }

    // Sorting
    const sortOptions = {};
    const validSortFields = [
      "arrival_date",
      "modal_price",
      "min_price",
      "max_price",
      "createdAt",
    ];
    const sortField = validSortFields.includes(sortBy)
      ? sortBy
      : "arrival_date";
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    let queryBuilder = MarketPrice.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Populate if requested
    if (populate === "true") {
      queryBuilder = queryBuilder
        .populate("state", "name name_gj")
        .populate("district", "name name_gj")
        .populate("market", "name name_gj")
        .populate("commodity", "name name_gj commodity_code img_url")
        .populate("variety", "name name_gj")
        .populate("grade", "name name_gj");
    }

    const results = await queryBuilder;

    // Get total count for pagination
    const totalRecords = await MarketPrice.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limitNum);

    return res.json({
      success: true,
      count: results.length,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      filters: {
        days: startDate && endDate ? "custom" : days,
        dateRange: query.arrival_date,
        state,
        district,
        market,
        commodity,
        variety,
        grade,
      },
      data: results,
    });
  } catch (error) {
    console.error("Error fetching market prices:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching market prices",
      error: error.message,
    });
  }
};

/**
 * Get Market Price Statistics
 * @route GET /api/v1/market-prices/stats
 * @access Public
 */
exports.getMarketPriceStats = async (req, res) => {
  try {
    const { days = 30, state, commodity } = req.query;

    // Build base query
    const query = {};

    // Date range (last N days excluding today)
    const daysCount = parseInt(days) || 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysCount);

    query.arrival_date = {
      $gte: startDate,
      $lte: endDate,
    };

    // Apply filters
    if (state) {
      const stateDoc = await State.findOne({ name: new RegExp(state, "i") });
      if (stateDoc) query.state = stateDoc._id;
    }

    if (commodity) {
      const commodityDoc = await Commodity.findOne({
        name: new RegExp(commodity, "i"),
      });
      if (commodityDoc) query.commodity = commodityDoc._id;
    }

    // Get statistics
    const stats = await MarketPrice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgModalPrice: { $avg: "$modal_price" },
          minModalPrice: { $min: "$modal_price" },
          maxModalPrice: { $max: "$modal_price" },
          avgMinPrice: { $avg: "$min_price" },
          avgMaxPrice: { $avg: "$max_price" },
        },
      },
    ]);

    // Get commodity-wise breakdown
    const commodityStats = await MarketPrice.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$commodity",
          count: { $sum: 1 },
          avgPrice: { $avg: "$modal_price" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "commodities",
          localField: "_id",
          foreignField: "_id",
          as: "commodityInfo",
        },
      },
      { $unwind: "$commodityInfo" },
      {
        $project: {
          commodity: "$commodityInfo.name",
          commodity_gj: "$commodityInfo.name_gj",
          commodityCode: "$commodityInfo.commodity_code",
          count: 1,
          avgPrice: { $round: ["$avgPrice", 2] },
        },
      },
    ]);

    // Get market-wise breakdown
    const marketStats = await MarketPrice.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$market",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "markets",
          localField: "_id",
          foreignField: "_id",
          as: "marketInfo",
        },
      },
      { $unwind: "$marketInfo" },
      {
        $project: {
          market: "$marketInfo.name",
          market_gj: "$marketInfo.name_gj",
          count: 1,
        },
      },
    ]);

    return res.json({
      success: true,
      dateRange: {
        startDate,
        endDate,
        days: daysCount,
      },
      overallStats: stats[0] || {
        totalRecords: 0,
        avgModalPrice: 0,
        minModalPrice: 0,
        maxModalPrice: 0,
      },
      topCommodities: commodityStats,
      topMarkets: marketStats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

/**
 * Get Unique Filter Values
 * @route GET /api/v1/market-prices/filters
 * @access Public
 */
exports.getFilterOptions = async (req, res) => {
  try {
    const states = await State.find().select("name name_gj").sort("name");
    const commodities = await Commodity.find()
      .select("name name_gj commodity_code img_url")
      .sort("name");
    const varieties = await Variety.find().select("name name_gj").sort("name");
    const grades = await Grade.find().select("name name_gj").sort("name");

    return res.json({
      success: true,
      filters: {
        states: states.map((s) => ({ name: s.name, name_gj: s.name_gj })),
        commodities: commodities.map((c) => ({
          name: c.name,
          name_gj: c.name_gj,
          code: c.commodity_code,
          img_url: c.img_url,
        })),
        varieties: varieties.map((v) => ({ name: v.name, name_gj: v.name_gj })),
        grades: grades.map((g) => ({ name: g.name, name_gj: g.name_gj })),
        dateRanges: [
          { label: "Last 7 Days", value: 7 },
          { label: "Last 15 Days", value: 15 },
          { label: "Last 30 Days", value: 30 },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching filters:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching filter options",
      error: error.message,
    });
  }
};

/**
 * Get Districts by State
 * @route GET /api/v1/market-prices/districts/:state
 * @access Public
 */
exports.getDistrictsByState = async (req, res) => {
  try {
    const { state } = req.params;

    const stateDoc = await State.findOne({ name: new RegExp(state, "i") });
    if (!stateDoc) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    const districts = await District.find({ state: stateDoc._id })
      .select("name name_gj")
      .sort("name");

    return res.json({
      success: true,
      state: stateDoc.name,
      state_gj: stateDoc.name_gj,
      count: districts.length,
      districts: districts.map((d) => ({
        id: d.id,
        name: d.name,
        name_gj: d.name_gj,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching districts",
      error: error.message,
    });
  }
};

/**
 * Get Markets by District
 * @route GET /api/v1/market-prices/markets/:district
 * @access Public
 */
exports.getMarketsByDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;
    const districtDoc = await District.findById(districtId).populate(
      "state",
      "name name_gj",
    );

    if (!districtDoc) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    const markets = await Market.find({ district: districtDoc._id })
      .select("name name_gj")
      .sort("name");

    return res.json({
      success: true,
      state: districtDoc.state.name,
      state_gj: districtDoc.state.name_gj,
      district: districtDoc.name,
      district_gj: districtDoc.name_gj,
      count: markets.length,
      markets: markets.map((m) => ({
        id: m._id,
        name: m.name,
        name_gj: m.name_gj,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching markets",
      error: error.message,
    });
  }
};
