const {
  MarketPrice,
  Market,
  State,
  District,
  Commodity,
  Variety,
  Grade,
} = require("../models");
const { getTodayDate } = require("../utils/dataGovApi");

/**
 * Get Market Analytics
 * Comprehensive analytics for a specific market comparing live data with historical data
 * @route GET /api/v1/analytics/market/:marketId
 * @access Public
 */
exports.getMarketAnalytics = async (req, res) => {
  try {
    // // log of timestamp when request is received
    // console.log(
    //   `Received request for market analytics at ${new Date().toISOString()}`,
    // );
    const { marketId } = req.params;

    // Step 1: Validate and get market information
    const market = await Market.findById(marketId)
      .populate("state", "name name_gj")
      .populate("district", "name name_gj");

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
        marketId,
      });
    }

    const marketInfo = {
      marketId: market._id,
      marketName: market.name,
      marketName_gj: market.name_gj,
      district: market.district.name,
      district_gj: market.district.name_gj,
      state: market.state.name,
      state_gj: market.state.name_gj,
    };
    // Step 2: Get today's date and date range
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Format today's date as string for response
    const todayStr = today.toISOString().split("T")[0];

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  

    // Step 3: Get ALL data from database (last 30 days INCLUDING today)
    // This now includes today's data from hourly sync
    const allMarketData = await MarketPrice.find({
      market: market._id,
      arrival_date: {
        $gte: thirtyDaysAgo,
        $lte: today, // Changed from $lt to $lte to include today
      },
    })
      .populate("commodity", "name name_gj commodity_code img_url")
      .populate("variety", "name name_gj")
      .populate("grade", "name name_gj")
      .sort({ arrival_date: -1 })
      .lean();

    // console.log(`Total DB records found: ${allMarketData.length}`);
    // console.log(`step 4 ${new Date().toISOString()}`);

    // Step 4: Separate today's data and historical data
    const todayData = allMarketData.filter((record) => {
      const recordDate = new Date(record.arrival_date);
      recordDate.setUTCHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    const historicalData = allMarketData.filter((record) => {
      const recordDate = new Date(record.arrival_date);
      recordDate.setUTCHours(0, 0, 0, 0);
      return recordDate.getTime() < today.getTime();
    });

    // console.log(`Today's records: ${todayData.length}`);
    // console.log(`Historical records: ${historicalData.length}`);
    // console.log(`step 5 ${new Date().toISOString()}`);

    // Step 5: Process today's data and create commodity map
    const liveCommodityMap = new Map();

    for (const record of todayData) {
      const commodityKey = record.commodity.name || "";

      // If commodity already exists in map, keep the higher price entry
      if (!liveCommodityMap.has(commodityKey)) {
        liveCommodityMap.set(commodityKey, {
          commodity: record.commodity.name,
          commodity_gj: record.commodity.name_gj,
          commodityId: record.commodity._id,
          commodityCode: record.commodity.commodity_code,
          img_url: record.commodity.img_url,
          modalPrice: record.modal_price || 0,
          minPrice: record.min_price || 0,
          maxPrice: record.max_price || 0,
          arrivalDate: record.arrival_date,
        });
      }
    }

    // console.log(`step 6 ${new Date().toISOString()}`);
    // Step 6: Create historical commodity map (group by commodity only)
    const historicalCommodityMap = new Map();

    for (const record of historicalData) {
      const commodityKey = record.commodity.name;

      if (!historicalCommodityMap.has(commodityKey)) {
        historicalCommodityMap.set(commodityKey, []);
      }

      historicalCommodityMap.get(commodityKey).push({
        commodity: record.commodity.name,
        commodity_gj: record.commodity.name_gj,
        commodityId: record.commodity._id,
        commodityCode: record.commodity.commodity_code,
        img_url: record.commodity.img_url,
        modalPrice: record.modal_price,
        minPrice: record.min_price,
        maxPrice: record.max_price,
        arrivalDate: record.arrival_date,
      });
    }
    // console.log(`step 7 ${new Date().toISOString()}`);
    // Step 7: Analyze commodities
    const analytics = {
      priceHikes: [],
      priceDrops: [],
      newCommodities: [],
      unchangedPrices: [],
      notUpdatedToday: [],
      remainingCommodities: [],
      updatedToday: [],
      allUniqueCommodity: [],
      highestPrice: null,
      lowestPrice: null,
      summary: {
        totalTodayRecords: todayData.length,
        totalHistoricalRecords: historicalData.length,
        uniqueCommodities: 0,
        commoditiesUpdatedToday: 0,
        commoditiesNotUpdatedToday: 0,
        newCommoditiesAddedToday: 0,
        remainingCommodities: 0,
      },
    };

    // Process today's commodities
    for (const [commodityKey, liveData] of liveCommodityMap.entries()) {
      const historicalRecords = historicalCommodityMap.get(commodityKey) || [];
      const commodityId = liveData.commodityId;
      const commodity_gj = liveData.commodity_gj;

      // Check if commodity ID exists (should always exist at this point)
      if (!commodityId) {
        // This shouldn't happen since we're getting data from DB
        analytics.newCommodities.push({
          commodityId: null,
          commodity: liveData.commodity,
          img_url: liveData.img_url,
          currentPrice: liveData.modalPrice,
          minPrice: liveData.minPrice,
          maxPrice: liveData.maxPrice,
          message: "New commodity added today",
        });
        analytics.summary.newCommoditiesAddedToday++;
        continue;
      }
      // console.log(`step 8 ${new Date().toISOString()}`);
      if (historicalRecords.length === 0) {
        // Commodity exists in master data but no historical records in last 30 days
        // Check if this commodity has any price records for this market
        const existingRecord = await MarketPrice.findOne({
          market: market._id,
          commodity: commodityId,
        })
          .populate("commodity", "name name_gj commodity_code img_url")
          .sort({ arrival_date: -1 })
          .lean();

        if (existingRecord) {
          // Commodity exists in DB but outside 30-day window - treat as updated today
          const priceDiff = liveData.modalPrice - existingRecord.modal_price;
          const priceChangePercent = existingRecord.modal_price
            ? ((priceDiff / existingRecord.modal_price) * 100).toFixed(2)
            : 0;

          const commodityData = {
            commodityId: existingRecord.commodity._id,
            commodity: liveData.commodity,
            commodity_gj: existingRecord.commodity.name_gj,
            img_url: existingRecord.commodity.img_url,
            currentPrice: liveData.modalPrice,
            lastPrice: existingRecord.modal_price,
            lastPriceDate: today,
            priceDifference: priceDiff,
            priceChangePercent: parseFloat(priceChangePercent),
            trend: priceDiff > 0 ? "up" : priceDiff < 0 ? "down" : "stable",
            historicalCount: 1,
          };

          analytics.updatedToday.push(commodityData);

          if (priceDiff > 0) {
            analytics.priceHikes.push(commodityData);
          } else if (priceDiff < 0) {
            analytics.priceDrops.push(commodityData);
          } else {
            analytics.unchangedPrices.push(commodityData);
          }

          analytics.summary.commoditiesUpdatedToday++;
        } else {
          // Commodity exists in master data but no price records for this market - treat as new entry
          const commodityData = {
            commodityId: commodityId,
            commodity: liveData.commodity,
            commodity_gj: commodity_gj,
            img_url: liveData.img_url,
            currentPrice: liveData.modalPrice,
            minPrice: liveData.minPrice,
            maxPrice: liveData.maxPrice,
            lastPrice: null,
            lastPriceDate: today,
            priceDifference: 0,
            priceChangePercent: 0,
            trend: "new_entry",
            historicalCount: 0,
          };

          analytics.updatedToday.push(commodityData);
          analytics.summary.commoditiesUpdatedToday++;
        }
      } else {
        // Commodity has historical records in last 30 days - updated today
        const lastRecord = historicalRecords[0]; // Most recent
        const priceDiff = liveData.modalPrice - lastRecord.modalPrice;
        const priceChangePercent = (
          (priceDiff / lastRecord.modalPrice) *
          100
        ).toFixed(2);
        // console.log(`step 9 ${new Date().toISOString()}`);
        const commodityData = {
          commodityId: lastRecord.commodityId,
          commodity: liveData.commodity,
          commodity_gj: lastRecord.commodity_gj,
          img_url: lastRecord.img_url,
          currentPrice: liveData.modalPrice,
          lastPrice: lastRecord.modalPrice,
          lastPriceDate: today,
          priceDifference: priceDiff,
          priceChangePercent: parseFloat(priceChangePercent),
          trend: priceDiff > 0 ? "up" : priceDiff < 0 ? "down" : "stable",
          historicalCount: historicalRecords.length,
        };

        analytics.updatedToday.push(commodityData);

        if (priceDiff > 0) {
          analytics.priceHikes.push(commodityData);
        } else if (priceDiff < 0) {
          analytics.priceDrops.push(commodityData);
        } else {
          analytics.unchangedPrices.push(commodityData);
        }

        analytics.summary.commoditiesUpdatedToday++;
      }
    }
    // console.log(`step 10 ${new Date().toISOString()}`);
    // Process commodities not updated today (exist in last 30 days but not in today's data)
    for (const [
      commodityKey,
      historicalRecords,
    ] of historicalCommodityMap.entries()) {
      if (!liveCommodityMap.has(commodityKey)) {
        // Get last two entries
        const recentEntries = historicalRecords.slice(0, 2);
        const entriesCount = historicalRecords.length;

        // Separate based on how many times the commodity appeared
        if (entriesCount === 1) {
          // Only appeared once in last 30 days - add to remainingCommodities
          const remainingData = {
            commodityId: recentEntries[0].commodityId,
            commodity: recentEntries[0].commodity,
            commodity_gj: recentEntries[0].commodity_gj,
            img_url: recentEntries[0].img_url,
            lastPrice: recentEntries[0].modalPrice,
            minPrice: recentEntries[0].minPrice,
            maxPrice: recentEntries[0].maxPrice,
            lastPriceDate: recentEntries[0].arrivalDate,
            entriesCount: 1,
            message: "Commodity has last price but not updated today",
          };

          analytics.remainingCommodities.push(remainingData);
          analytics.summary.remainingCommodities++;
        } else {
          // Appeared multiple times - add to notUpdatedToday
          const notUpdatedData = {
            commodityId: recentEntries[0].commodityId,
            commodity: recentEntries[0].commodity,
            commodity_gj: recentEntries[0].commodity_gj,
            img_url: recentEntries[0].img_url,
            lastPrice: recentEntries[0].modalPrice,
            lastPriceDate: recentEntries[0].arrivalDate,
            entriesCount: entriesCount,
          };

          if (recentEntries.length >= 2) {
            const priceDiff =
              recentEntries[0].modalPrice - recentEntries[1].modalPrice;
            const priceChangePercent = (
              (priceDiff / recentEntries[1].modalPrice) *
              100
            ).toFixed(2);

            notUpdatedData.previousPrice = recentEntries[1].modalPrice;
            notUpdatedData.previousPriceDate = recentEntries[1].arrivalDate;
            notUpdatedData.lastPriceChange = priceDiff;
            notUpdatedData.lastPriceChangePercent =
              parseFloat(priceChangePercent);
            notUpdatedData.lastTrend =
              priceDiff > 0 ? "up" : priceDiff < 0 ? "down" : "stable";
          }

          analytics.notUpdatedToday.push(notUpdatedData);
          analytics.summary.commoditiesNotUpdatedToday++;
        }
      }
    }
    // console.log(`step 11 ${new Date().toISOString()}`);
    // Find highest and lowest prices from today's data
    if (todayData.length > 0) {
      let highest = todayData[0];
      let lowest = todayData[0];

      for (const record of todayData) {
        const modalPrice = record.modal_price || 0;
        if (modalPrice > (highest.modal_price || 0)) {
          highest = record;
        }
        if (modalPrice < (lowest.modal_price || 0)) {
          lowest = record;
        }
      }

      analytics.highestPrice = {
        commodityId: highest.commodity._id,
        commodity: highest.commodity.name,
        commodity_gj: highest.commodity.name_gj,
        img_url: highest.commodity.img_url,
        modalPrice: highest.modal_price,
        minPrice: highest.min_price,
        maxPrice: highest.max_price,
      };

      analytics.lowestPrice = {
        commodityId: lowest.commodity._id,
        commodity: lowest.commodity.name,
        commodity_gj: lowest.commodity.name_gj,
        img_url: lowest.commodity.img_url,
        modalPrice: lowest.modal_price,
        minPrice: lowest.min_price,
        maxPrice: lowest.max_price,
      };
    }

    // Create allUniqueCommodity array from all three arrays
    const commodityMap = new Map();

    // Add from updatedToday
    analytics.updatedToday.forEach((item) => {
      if (item.commodityId && !commodityMap.has(item.commodityId.toString())) {
        commodityMap.set(item.commodityId.toString(), {
          commodityId: item.commodityId,
          commodity: item.commodity,
          commodity_gj: item.commodity_gj,
          img_url: item.img_url,
        });
      }
    });

    // Add from notUpdatedToday
    analytics.notUpdatedToday.forEach((item) => {
      if (item.commodityId && !commodityMap.has(item.commodityId.toString())) {
        commodityMap.set(item.commodityId.toString(), {
          commodityId: item.commodityId,
          commodity: item.commodity,
          commodity_gj: item.commodity_gj,
          img_url: item.img_url,
        });
      }
    });

    // Add from remainingCommodities
    analytics.remainingCommodities.forEach((item) => {
      if (item.commodityId && !commodityMap.has(item.commodityId.toString())) {
        commodityMap.set(item.commodityId.toString(), {
          commodityId: item.commodityId,
          commodity: item.commodity,
          commodity_gj: item.commodity_gj,
          img_url: item.img_url,
        });
      }
    });

    analytics.allUniqueCommodity = Array.from(commodityMap.values());

    // Sort arrays
    analytics.priceHikes.sort(
      (a, b) => b.priceChangePercent - a.priceChangePercent,
    );
    analytics.priceDrops.sort(
      (a, b) => a.priceChangePercent - b.priceChangePercent,
    );

    // Update summary
    analytics.summary.uniqueCommodities =
      liveCommodityMap.size + analytics.summary.commoditiesNotUpdatedToday;
    // console.log(`step 12 ${new Date().toISOString()}`);
    // Step 8: Return comprehensive analytics
    return res.json({
      success: true,
      market: marketInfo,
      date: todayStr,
      analytics,
    });
  } catch (error) {
    console.error("Error generating market analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate market analytics",
      error: error.message,
    });
  }
};

/**
 * Get Commodity Analytics for Market
 * Get detailed analytics for a specific commodity in a specific market
 * @route GET /api/v1/analytics/market/:marketId/commodity/:commodityId
 * @query days=7|15|30 (optional, default: 30)
 * @access Public
 */
exports.getCommodityAnalytics = async (req, res) => {
  try {
    const { marketId, commodityId } = req.params;
    const { days = "30" } = req.query;

    // Validate days parameter
    const daysNum = parseInt(days);
    if (![7, 15, 30].includes(daysNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid days parameter. Allowed values: 7, 15, 30",
      });
    }

    // Step 1: Validate market and commodity
    const market = await Market.findById(marketId)
      .populate("state", "name name_gj")
      .populate("district", "name name_gj");

    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
        marketId,
      });
    }

    const commodity = await Commodity.findById(commodityId);
    if (!commodity) {
      return res.status(404).json({
        success: false,
        message: "Commodity not found",
        commodityId,
      });
    }

    // Step 2: Get today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = getTodayDate();

    // Step 3: Get data from database (including today's data)
    const daysAgo = new Date(today);
    daysAgo.setDate(daysAgo.getDate() - daysNum);

    // console.log(
    //   `Fetching data from DB for market: ${market.name}, commodity: ${commodity.name} (Last ${daysNum} days including today)`,
    // );

    // Fetch all data including today from database
    const allData = await MarketPrice.find({
      market: market._id,
      commodity: commodity._id,
      arrival_date: {
        $gte: daysAgo,
        $lte: today, // Include today
      },
    })
      .populate("variety", "name name_gj")
      .populate("grade", "name name_gj")
      .sort({ arrival_date: -1 })
      .lean();

    // console.log(`Total records found: ${allData.length}`);

    // Separate today's data and historical data
    const todayData = allData.filter((record) => {
      const recordDate = new Date(record.arrival_date);
      recordDate.setUTCHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    const historicalData = allData.filter((record) => {
      const recordDate = new Date(record.arrival_date);
      recordDate.setUTCHours(0, 0, 0, 0);
      return recordDate.getTime() < today.getTime();
    });

    console.log(`Today's records: ${todayData.length}`);
    console.log(`Historical records: ${historicalData.length}`);

    // Step 4: Check if commodity was updated today
    let todayPrice = null;
    let isUpdatedToday = false;

    if (todayData.length > 0) {
      // Commodity is updated today, get the latest price
      const todayRecord = todayData[0]; // Already sorted by date descending
      isUpdatedToday = true;
      todayPrice = {
        date: todayStr,
        modalPrice: todayRecord.modal_price || 0,
        minPrice: todayRecord.min_price || 0,
        maxPrice: todayRecord.max_price || 0,
        arrivalDate: todayRecord.arrival_date,
      };
    }

    console.log(
      `Historical records found for last ${daysNum} days: ${historicalData.length}`,
    );

    // Step 5: Get latest 3 prices (including today if updated)
    let latestPrices = [];

    if (isUpdatedToday && todayPrice) {
      // If updated today, add today's price first
      latestPrices.push({
        date: todayPrice.date,
        modalPrice: todayPrice.modalPrice,
        minPrice: todayPrice.minPrice,
        maxPrice: todayPrice.maxPrice,
        variety: null,
        variety_gj: null,
        grade: null,
        grade_gj: null,
      });

      // Then add up to 2 more from historical data
      if (historicalData.length > 0) {
        const additionalPrices = historicalData.slice(0, 2).map((record) => ({
          date: record.arrival_date,
          modalPrice: record.modal_price,
          minPrice: record.min_price,
          maxPrice: record.max_price,
          variety: record.variety ? record.variety.name : null,
          variety_gj: record.variety ? record.variety.name_gj : null,
          grade: record.grade ? record.grade.name : null,
          grade_gj: record.grade ? record.grade.name_gj : null,
        }));
        latestPrices.push(...additionalPrices);
      }
    } else if (historicalData.length > 0) {
      // If not updated today, get latest 3 from historical data
      latestPrices = historicalData.slice(0, 3).map((record) => ({
        date: record.arrival_date,
        modalPrice: record.modal_price,
        minPrice: record.min_price,
        maxPrice: record.max_price,
        variety: record.variety ? record.variety.name : null,
        variety_gj: record.variety ? record.variety.name_gj : null,
        grade: record.grade ? record.grade.name : null,
        grade_gj: record.grade ? record.grade.name_gj : null,
      }));
    }

    // Step 6: Prepare price history for charts
    const priceHistory = historicalData.map((record) => ({
      date: record.arrival_date,
      modalPrice: record.modal_price,
      minPrice: record.min_price,
      maxPrice: record.max_price,
    }));

    // Add today's price if available
    if (todayPrice) {
      priceHistory.unshift({
        date: today,
        modalPrice: todayPrice.modalPrice,
        minPrice: todayPrice.minPrice,
        maxPrice: todayPrice.maxPrice,
      });
    }

    // Step 7: Calculate analytics
    const analytics = {
      isUpdatedToday,
      todayPrice: todayPrice,
      latestPrices: latestPrices,
      priceHistory: priceHistory,
      statistics: {},
      trends: {},
      movingAverages: {},
      varietyAnalysis: {},
      quickSummary: {},
    };

    // Calculate statistics if we have data
    if (priceHistory.length > 0) {
      const modalPrices = priceHistory.map((p) => p.modalPrice);
      const minPrices = priceHistory.map((p) => p.minPrice);
      const maxPrices = priceHistory.map((p) => p.maxPrice);

      const avgModalPrice =
        modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length;

      // Calculate Standard Deviation
      const variance =
        modalPrices.reduce(
          (sum, price) => sum + Math.pow(price - avgModalPrice, 2),
          0,
        ) / modalPrices.length;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = avgModalPrice
        ? (standardDeviation / avgModalPrice) * 100
        : 0;

      // Volatility interpretation
      let volatilityLevel = "stable";
      if (coefficientOfVariation > 15) volatilityLevel = "high";
      else if (coefficientOfVariation > 8) volatilityLevel = "moderate";

      // Basic statistics
      analytics.statistics = {
        totalRecords: priceHistory.length,
        period: `${daysNum} days`,
        modalPrice: {
          highest: Math.max(...modalPrices),
          lowest: Math.min(...modalPrices),
          average: avgModalPrice.toFixed(2),
          current: priceHistory[0].modalPrice,
        },
        minPrice: {
          highest: Math.max(...minPrices),
          lowest: Math.min(...minPrices),
          average: (
            minPrices.reduce((a, b) => a + b, 0) / minPrices.length
          ).toFixed(2),
        },
        maxPrice: {
          highest: Math.max(...maxPrices),
          lowest: Math.min(...maxPrices),
          average: (
            maxPrices.reduce((a, b) => a + b, 0) / maxPrices.length
          ).toFixed(2),
        },
        volatilityMetrics: {
          standardDeviation: parseFloat(standardDeviation.toFixed(2)),
          coefficientOfVariation: parseFloat(coefficientOfVariation.toFixed(2)),
          volatilityLevel: volatilityLevel,
          interpretation:
            volatilityLevel === "stable"
              ? "Low volatility - prices are stable"
              : volatilityLevel === "moderate"
                ? "Moderate volatility - prices fluctuate moderately"
                : "High volatility - prices are highly unstable",
        },
      };

      // Trend analysis
      if (priceHistory.length >= 2) {
        const currentPrice = priceHistory[0].modalPrice;
        const previousPrice = priceHistory[1].modalPrice;
        const oldestPrice = priceHistory[priceHistory.length - 1].modalPrice;

        const recentChange = currentPrice - previousPrice;
        const recentChangePercent = previousPrice
          ? ((recentChange / previousPrice) * 100).toFixed(2)
          : 0;

        const overallChange = currentPrice - oldestPrice;
        const overallChangePercent = oldestPrice
          ? ((overallChange / oldestPrice) * 100).toFixed(2)
          : 0;

        analytics.trends = {
          recentTrend: {
            change: recentChange,
            changePercent: parseFloat(recentChangePercent),
            direction:
              recentChange > 0 ? "up" : recentChange < 0 ? "down" : "stable",
            comparison: "vs previous day",
          },
          overallTrend: {
            change: overallChange,
            changePercent: parseFloat(overallChangePercent),
            direction:
              overallChange > 0 ? "up" : overallChange < 0 ? "down" : "stable",
            comparison: `vs ${daysNum} days ago`,
          },
          volatility: {
            priceRange:
              analytics.statistics.modalPrice.highest -
              analytics.statistics.modalPrice.lowest,
            priceRangePercent: analytics.statistics.modalPrice.lowest
              ? (
                  ((analytics.statistics.modalPrice.highest -
                    analytics.statistics.modalPrice.lowest) /
                    analytics.statistics.modalPrice.lowest) *
                  100
                ).toFixed(2)
              : 0,
          },
        };
      }

      // Price movement analysis
      let priceIncreases = 0;
      let priceDecreases = 0;
      let priceStable = 0;

      for (let i = 0; i < priceHistory.length - 1; i++) {
        const diff =
          priceHistory[i].modalPrice - priceHistory[i + 1].modalPrice;
        if (diff > 0) priceIncreases++;
        else if (diff < 0) priceDecreases++;
        else priceStable++;
      }

      analytics.trends.priceMovement = {
        increases: priceIncreases,
        decreases: priceDecreases,
        stable: priceStable,
        totalComparisons: priceHistory.length - 1,
      };

      // Calculate Moving Averages
      const calculateMA = (data, period) => {
        if (data.length < period) return null;
        const sum = data
          .slice(0, period)
          .reduce((acc, item) => acc + item.modalPrice, 0);
        return parseFloat((sum / period).toFixed(2));
      };

      analytics.movingAverages = {
        ma7: calculateMA(priceHistory, 7),
        ma14: calculateMA(priceHistory, 14),
        ma30: calculateMA(priceHistory, 30),
      };

      // Variety and Grade Analysis
      if (historicalData.length > 0) {
        const varietyMap = new Map();
        const gradeMap = new Map();

        historicalData.forEach((record) => {
          const varietyName = record.variety ? record.variety.name : "Unknown";
          const varietyNameGj = record.variety ? record.variety.name_gj : null;
          const gradeName = record.grade ? record.grade.name : "Unknown";
          const gradeNameGj = record.grade ? record.grade.name_gj : null;

          // Variety analysis
          if (!varietyMap.has(varietyName)) {
            varietyMap.set(varietyName, {
              variety: varietyName,
              variety_gj: varietyNameGj,
              prices: [],
              count: 0,
            });
          }
          const varietyData = varietyMap.get(varietyName);
          varietyData.prices.push(record.modal_price);
          varietyData.count++;

          // Grade analysis
          if (!gradeMap.has(gradeName)) {
            gradeMap.set(gradeName, {
              grade: gradeName,
              grade_gj: gradeNameGj,
              prices: [],
              count: 0,
            });
          }
          const gradeData = gradeMap.get(gradeName);
          gradeData.prices.push(record.modal_price);
          gradeData.count++;
        });

        // Calculate variety statistics
        const varieties = Array.from(varietyMap.values()).map((v) => ({
          variety: v.variety,
          variety_gj: v.variety_gj,
          count: v.count,
          avgPrice: parseFloat(
            (v.prices.reduce((a, b) => a + b, 0) / v.prices.length).toFixed(2),
          ),
          minPrice: Math.min(...v.prices),
          maxPrice: Math.max(...v.prices),
        }));

        // Calculate grade statistics
        const grades = Array.from(gradeMap.values()).map((g) => ({
          grade: g.grade,
          grade_gj: g.grade_gj,
          count: g.count,
          avgPrice: parseFloat(
            (g.prices.reduce((a, b) => a + b, 0) / g.prices.length).toFixed(2),
          ),
          minPrice: Math.min(...g.prices),
          maxPrice: Math.max(...g.prices),
        }));

        // Sort by average price
        varieties.sort((a, b) => b.avgPrice - a.avgPrice);
        grades.sort((a, b) => b.avgPrice - a.avgPrice);

        const priceSpread =
          varieties.length > 1
            ? varieties[0].avgPrice - varieties[varieties.length - 1].avgPrice
            : 0;

        analytics.varietyAnalysis = {
          varieties: varieties,
          grades: grades,
          hasMultipleVarieties: varieties.length > 1,
          hasMultipleGrades: grades.length > 1,
          priceSpread: parseFloat(priceSpread.toFixed(2)),
        };
      }

      // Quick Summary for Frontend Cards
      const currentPrice = priceHistory[0].modalPrice;
      const avgPrice = parseFloat(analytics.statistics.modalPrice.average);
      const priceLevel =
        currentPrice > avgPrice * 1.05
          ? "above_average"
          : currentPrice < avgPrice * 0.95
            ? "below_average"
            : "average";

      const trendDirection =
        priceHistory.length >= 2
          ? analytics.trends.recentTrend.direction
          : "stable";
      const trendIcon =
        trendDirection === "up"
          ? "📈"
          : trendDirection === "down"
            ? "📉"
            : "➡️";

      const changePercent =
        priceHistory.length >= 2
          ? analytics.trends.recentTrend.changePercent
          : 0;

      // Simple recommendation logic
      let recommendation = "";
      if (trendDirection === "up" && priceLevel !== "below_average") {
        recommendation = "Rising prices - good time for sellers";
      } else if (trendDirection === "down" && priceLevel !== "above_average") {
        recommendation = "Falling prices - good time for buyers";
      } else if (priceLevel === "above_average") {
        recommendation = "Prices above average - consider selling";
      } else if (priceLevel === "below_average") {
        recommendation = "Prices below average - good buying opportunity";
      } else {
        recommendation = "Prices stable - monitor market conditions";
      }

      analytics.quickSummary = {
        status: isUpdatedToday ? "live" : "historical",
        currentPrice: currentPrice,
        trend: trendDirection,
        trendIcon: trendIcon,
        changePercent: changePercent,
        changeText:
          priceHistory.length >= 2
            ? `${changePercent > 0 ? "+" : ""}${changePercent}% vs ${
                analytics.trends.recentTrend.comparison
              }`
            : "No change data",
        priceLevel: priceLevel,
        recommendation: recommendation,
        volatility: analytics.statistics.volatilityMetrics.volatilityLevel,
      };
    } else {
      analytics.statistics = {
        message: `No price data found for last ${daysNum} days`,
      };
      analytics.trends = {
        message: "Insufficient data for trend analysis",
      };
      analytics.movingAverages = {
        message: "Insufficient data for moving averages",
      };
      analytics.varietyAnalysis = {
        message: "No data available for variety analysis",
      };
      analytics.quickSummary = {
        status: "no_data",
        message: "No price data available for the selected period",
      };
    }

    // Step 8: Return response
    return res.json({
      success: true,
      market: {
        marketId: market._id,
        marketName: market.name,
        marketName_gj: market.name_gj,
        district: market.district.name,
        district_gj: market.district.name_gj,
        state: market.state.name,
        state_gj: market.state.name_gj,
      },
      commodity: {
        commodityId: commodity._id,
        commodityName: commodity.name,
        commodityName_gj: commodity.name_gj,
        commodityCode: commodity.commodity_code,
        img_url: commodity.img_url,
      },
      period: {
        days: daysNum,
        from: daysAgo.toISOString().split("T")[0],
        to: todayStr,
      },
      analytics,
    });
  } catch (error) {
    console.error("Error generating commodity analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate commodity analytics",
      error: error.message,
    });
  }
};

/**
 * Compare Commodity Prices Across Markets
 * Compare a specific commodity's prices between two markets
 * @route GET /api/v1/analytics/compare
 * @query commodityId - Commodity ID (required)
 * @query marketIdA - First market ID (required)
 * @query marketIdB - Second market ID (required)
 * @query days - Period for comparison (7, 15, or 30, default: 7)
 * @access Public
 */
exports.compareCommodityPrices = async (req, res) => {
  try {
    const { commodityId, marketIdA, marketIdB, days = "7" } = req.query;

    // Validate required parameters
    if (!commodityId || !marketIdA || !marketIdB) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: commodityId, marketIdA, marketIdB",
      });
    }

    // Validate days parameter
    const daysNum = parseInt(days);
    if (![7, 15, 30].includes(daysNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid days parameter. Allowed values: 7, 15, 30",
      });
    }

    // Step 1: Validate commodity
    const commodity = await Commodity.findById(commodityId);
    if (!commodity) {
      return res.status(404).json({
        success: false,
        message: "Commodity not found",
        commodityId,
      });
    }

    // Step 2: Validate both markets
    const marketA = await Market.findById(marketIdA)
      .populate("state", "name name_gj")
      .populate("district", "name name_gj");

    if (!marketA) {
      return res.status(404).json({
        success: false,
        message: "Market A not found",
        marketIdA,
      });
    }

    const marketB = await Market.findById(marketIdB)
      .populate("state", "name name_gj")
      .populate("district", "name name_gj");

    if (!marketB) {
      return res.status(404).json({
        success: false,
        message: "Market B not found",
        marketIdB,
      });
    }

    // Step 3: Get today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = getTodayDate();
    const daysAgo = new Date(today);
    daysAgo.setDate(daysAgo.getDate() - daysNum);

    // Helper function to get market data
    const getMarketData = async (market) => {
      console.log(
        `Fetching data from DB for market: ${market.name}, commodity: ${commodity.name}`,
      );

      // Get all data from database including today
      const allData = await MarketPrice.find({
        market: market._id,
        commodity: commodity._id,
        arrival_date: {
          $gte: daysAgo,
          $lte: today, // Include today
        },
      })
        .sort({ arrival_date: -1 })
        .lean();

      // Separate today's data and historical data
      const todayData = allData.filter((record) => {
        const recordDate = new Date(record.arrival_date);
        recordDate.setUTCHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });

      const historicalData = allData.filter((record) => {
        const recordDate = new Date(record.arrival_date);
        recordDate.setUTCHours(0, 0, 0, 0);
        return recordDate.getTime() < today.getTime();
      });

      let currentPrice = null;
      let isUpdatedToday = false;
      let lastUpdated = null;

      // Check if commodity was updated today in database
      if (todayData.length > 0) {
        const todayRecord = todayData[0]; // Already sorted by date descending
        isUpdatedToday = true;
        currentPrice = {
          modalPrice: todayRecord.modal_price || 0,
          minPrice: todayRecord.min_price || 0,
          maxPrice: todayRecord.max_price || 0,
        };
        lastUpdated = today;
      }

      // Prepare price history
      const priceHistory = historicalData.map((record) => ({
        date: record.arrival_date,
        modalPrice: record.modal_price,
        minPrice: record.min_price,
        maxPrice: record.max_price,
      }));

      // Add today's price if available
      if (currentPrice) {
        priceHistory.unshift({
          date: today,
          modalPrice: currentPrice.modalPrice,
          minPrice: currentPrice.minPrice,
          maxPrice: currentPrice.maxPrice,
        });
      }

      // If no data at all, check if there's any historical data
      if (priceHistory.length === 0) {
        const anyHistoricalData = await MarketPrice.findOne({
          market: market._id,
          commodity: commodity._id,
        })
          .sort({ arrival_date: -1 })
          .lean();

        if (anyHistoricalData) {
          currentPrice = {
            modalPrice: anyHistoricalData.modal_price,
            minPrice: anyHistoricalData.min_price,
            maxPrice: anyHistoricalData.max_price,
          };
          lastUpdated = anyHistoricalData.arrival_date;
          priceHistory.push({
            date: anyHistoricalData.arrival_date,
            modalPrice: anyHistoricalData.modal_price,
            minPrice: anyHistoricalData.min_price,
            maxPrice: anyHistoricalData.max_price,
          });
        }
      } else if (!currentPrice) {
        // Use most recent from history
        const mostRecent = priceHistory[0];
        currentPrice = {
          modalPrice: mostRecent.modalPrice,
          minPrice: mostRecent.minPrice,
          maxPrice: mostRecent.maxPrice,
        };
        lastUpdated = mostRecent.date;
      }

      // Calculate statistics
      let stats = {};
      if (priceHistory.length > 0) {
        const modalPrices = priceHistory.map((p) => p.modalPrice);
        const minPrices = priceHistory.map((p) => p.minPrice);
        const maxPrices = priceHistory.map((p) => p.maxPrice);

        // Calculate trend
        let trend = "stable";
        let changePercent = 0;
        if (priceHistory.length >= 2) {
          const currentP = priceHistory[0].modalPrice;
          const previousP = priceHistory[1].modalPrice;
          const change = currentP - previousP;
          changePercent = previousP
            ? parseFloat(((change / previousP) * 100).toFixed(2))
            : 0;
          trend = change > 0 ? "up" : change < 0 ? "down" : "stable";
        }

        stats = {
          currentPrice: currentPrice ? currentPrice.modalPrice : null,
          minPrice: Math.min(...minPrices),
          maxPrice: Math.max(...maxPrices),
          avgPrice: parseFloat(
            (
              modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length
            ).toFixed(2),
          ),
          trend: trend,
          changePercent: changePercent,
          lastUpdated: lastUpdated,
          priceHistory: priceHistory,
        };
      } else {
        stats = {
          currentPrice: currentPrice ? currentPrice.modalPrice : null,
          minPrice: currentPrice ? currentPrice.minPrice : null,
          maxPrice: currentPrice ? currentPrice.maxPrice : null,
          avgPrice: currentPrice ? currentPrice.modalPrice : null,
          trend: "no_data",
          changePercent: 0,
          lastUpdated: lastUpdated,
          priceHistory: [],
        };
      }

      return {
        marketId: market._id,
        marketName: market.name,
        marketName_gj: market.name_gj,
        district: market.district.name,
        district_gj: market.district.name_gj,
        state: market.state.name,
        state_gj: market.state.name_gj,
        ...stats,
      };
    };

    // Step 4: Get data for both markets
    const marketAData = await getMarketData(marketA);
    const marketBData = await getMarketData(marketB);

    // Step 5: Compare prices
    const comparison = {
      marketA: marketAData,
      marketB: marketBData,
    };

    // Calculate price difference
    if (marketAData.currentPrice && marketBData.currentPrice) {
      const priceDiff = marketAData.currentPrice - marketBData.currentPrice;
      const priceDiffPercent = marketBData.currentPrice
        ? parseFloat(
            ((Math.abs(priceDiff) / marketBData.currentPrice) * 100).toFixed(2),
          )
        : 0;

      comparison.priceDifference = parseFloat(Math.abs(priceDiff).toFixed(2));
      comparison.priceDifferencePercent = priceDiffPercent;
      comparison.cheaperMarket =
        priceDiff > 0 ? "marketB" : priceDiff < 0 ? "marketA" : "equal";

      // Generate recommendation
      if (comparison.cheaperMarket === "marketB") {
        comparison.recommendation = `${marketBData.marketName} is ₹${comparison.priceDifference} cheaper (${priceDiffPercent}% less)`;
      } else if (comparison.cheaperMarket === "marketA") {
        comparison.recommendation = `${marketAData.marketName} is ₹${comparison.priceDifference} cheaper (${priceDiffPercent}% less)`;
      } else {
        comparison.recommendation = "Both markets have similar prices";
      }

      // Add better market suggestion
      const avgDiff = marketAData.avgPrice - marketBData.avgPrice;
      if (Math.abs(avgDiff) > 50) {
        const betterMarket = avgDiff > 0 ? marketBData : marketAData;
        comparison.recommendation += `. ${betterMarket.marketName} has consistently better prices on average.`;
      }
    } else {
      comparison.priceDifference = null;
      comparison.priceDifferencePercent = null;
      comparison.cheaperMarket = "insufficient_data";
      comparison.recommendation =
        "Insufficient data to compare prices for this commodity in selected markets";
    }

    // Step 6: Return response
    return res.json({
      success: true,
      commodity: {
        commodityId: commodity._id,
        commodityName: commodity.name,
        commodityName_gj: commodity.name_gj,
        commodityCode: commodity.commodity_code,
        img_url: commodity.img_url,
      },
      period: {
        days: daysNum,
        from: daysAgo.toISOString().split("T")[0],
        to: todayStr,
      },
      comparison,
    });
  } catch (error) {
    console.error("Error comparing commodity prices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to compare commodity prices",
      error: error.message,
    });
  }
};

/**
 * Get Markets List
 * Get all markets with their state and district info for selection
 * @route GET /api/v1/analytics/markets
 * @access Public
 */
exports.getMarketsList = async (req, res) => {
  try {
    const { state, district } = req.query;

    const query = {};

    if (state) {
      const stateDoc = await State.findOne({ name: new RegExp(state, "i") });
      if (stateDoc) {
        query.state = stateDoc._id;
      }
    }

    if (district) {
      const districtDoc = await District.findOne({
        name: new RegExp(district, "i"),
      });
      if (districtDoc) {
        query.district = districtDoc._id;
      }
    }

    const markets = await Market.find(query)
      .populate("state", "name name_gj")
      .populate("district", "name name_gj")
      .sort({ name: 1 })
      .lean();

    return res.json({
      success: true,
      count: markets.length,
      markets: markets.map((m) => ({
        id: m._id,
        name: m.name,
        name_gj: m.name_gj,
        district: m.district.name,
        district_gj: m.district.name_gj,
        state: m.state.name,
        state_gj: m.state.name_gj,
      })),
    });
  } catch (error) {
    console.error("Error fetching markets list:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch markets list",
      error: error.message,
    });
  }
};
