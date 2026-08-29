const {
  PriceAlert,
  District,
  Market,
  Commodity,
  Variety,
  Grade,
} = require("../models");

/**
 * @route   POST /api/v1/alerts
 * @desc    Create a new price alert
 * @access  Private (Requires authentication)
 */
exports.createAlert = async (req, res) => {
  try {
    const {
      districtId,
      marketId,
      commodityId,
      varietyId,
      gradeId,
      targetPrice,
      direction,
      isActive,
    } = req.body;

    const userId = req.user.userId; // From auth middleware

    // Validation
    if (!districtId || !marketId || !commodityId) {
      return res.status(400).json({
        success: false,
        message: "District, Market, and Commodity are required",
      });
    }

    if (!targetPrice) {
      return res.status(400).json({
        success: false,
        message: "Target price is required",
      });
    }

    if (!direction || !["up", "down"].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Direction is required (either "up" or "down")',
      });
    }

    // Verify district exists
    const district = await District.findById(districtId);
    if (!district) {
      return res.status(404).json({
        success: false,
        message: "District not found",
      });
    }

    // Verify market exists
    const market = await Market.findById(marketId);
    if (!market) {
      return res.status(404).json({
        success: false,
        message: "Market not found",
      });
    }

    // Verify market belongs to the selected district
    if (market.district.toString() !== districtId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Selected market does not belong to the selected district",
      });
    }

    // Verify commodity exists
    const commodity = await Commodity.findById(commodityId);
    if (!commodity) {
      return res.status(404).json({
        success: false,
        message: "Commodity not found",
      });
    }

    // Verify variety if provided
    if (varietyId) {
      const variety = await Variety.findById(varietyId);
      if (!variety) {
        return res.status(404).json({
          success: false,
          message: "Variety not found",
        });
      }
    }

    // Verify grade if provided
    if (gradeId) {
      const grade = await Grade.findById(gradeId);
      if (!grade) {
        return res.status(404).json({
          success: false,
          message: "Grade not found",
        });
      }
    }

    // Check for duplicate alert (same user, market, commodity, direction)
    const existingAlert = await PriceAlert.findOne({
      user: userId,
      market: marketId,
      commodity: commodityId,
      direction: direction,
    });

    if (existingAlert) {
      return res.status(400).json({
        success: false,
        message: `You already have a "${direction}" alert for this commodity in this market. Each user can set maximum 2 alerts per market-commodity: one "up" and one "down".`,
      });
    }

    // Create alert
    const alert = new PriceAlert({
      user: userId,
      district: districtId,
      market: marketId,
      commodity: commodityId,
      variety: varietyId || null,
      grade: gradeId || null,
      targetPrice,
      direction,
      isActive: isActive !== undefined ? isActive : true, // Default to true if not provided
    });

    await alert.save();

    // Populate references before sending response
    await alert.populate([
      { path: "district", select: "name name_gj" },
      { path: "market", select: "name name_gj" },
      { path: "commodity", select: "name name_gj" },
      { path: "variety", select: "name name_gj" },
      { path: "grade", select: "name name_gj" },
    ]);

    res.status(201).json({
      success: true,
      message: "Price alert created successfully",
      data: { alert },
    });
  } catch (error) {
    console.error("Create alert error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating price alert",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/v1/alerts
 * @desc    Get all alerts for logged-in user
 * @access  Private
 */
exports.getMyAlerts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isActive, market, commodity } = req.query;

    // Build query
    const query = { user: userId };

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (market) {
      query.market = market;
    }

    if (commodity) {
      query.commodity = commodity;
    }

    const alerts = await PriceAlert.find(query)
      .populate("district", "name name_gj")
      .populate("market", "name name_gj")
      .populate("commodity", "name name_gj img_url")
      .populate("variety", "name name_gj")
      .populate("grade", "name name_gj")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: { alerts },
    });
  } catch (error) {
    console.error("Get alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching alerts",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/v1/alerts/:id
 * @desc    Get single alert by ID
 * @access  Private
 */
exports.getAlertById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const alert = await PriceAlert.findOne({ _id: id, user: userId })
      .populate("district", "name name_gj")
      .populate("market", "name name_gj")
      .populate("commodity", "name name_gj img_url")
      .populate("variety", "name name_gj")
      .populate("grade", "name name_gj");

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { alert },
    });
  } catch (error) {
    console.error("Get alert by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching alert",
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/v1/alerts/:id
 * @desc    Update an alert
 * @access  Private
 */
exports.updateAlert = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { targetPrice, direction, isActive, varietyId, gradeId } = req.body;

    // Find alert and verify ownership
    const alert = await PriceAlert.findOne({ _id: id, user: userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // Update fields
    if (targetPrice !== undefined) {
      alert.targetPrice = targetPrice;
    }
    if (direction !== undefined) {
      if (!["up", "down"].includes(direction)) {
        return res.status(400).json({
          success: false,
          message: 'Direction must be either "up" or "down"',
        });
      }

      // Check for duplicate alert when changing direction (exclude current alert)
      const existingAlert = await PriceAlert.findOne({
        _id: { $ne: id }, // Exclude current alert
        user: userId,
        market: alert.market,
        commodity: alert.commodity,
        direction: direction,
      });

      if (existingAlert) {
        return res.status(400).json({
          success: false,
          message: `You already have a "${direction}" alert for this commodity in this market. Each user can set maximum 2 alerts per market-commodity: one "up" and one "down".`,
        });
      }

      alert.direction = direction;
    }
    if (isActive !== undefined) {
      alert.isActive = isActive;
    }
    if (varietyId !== undefined) {
      alert.variety = varietyId || null;
    }
    if (gradeId !== undefined) {
      alert.grade = gradeId || null;
    }

    await alert.save();

    // Populate and return
    await alert.populate([
      { path: "district", select: "name name_gj" },
      { path: "market", select: "name name_gj" },
      { path: "commodity", select: "name name_gj" },
      { path: "variety", select: "name name_gj" },
      { path: "grade", select: "name name_gj" },
    ]);

    res.status(200).json({
      success: true,
      message: "Alert updated successfully",
      data: { alert },
    });
  } catch (error) {
    console.error("Update alert error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating alert",
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/v1/alerts/:id
 * @desc    Delete an alert
 * @access  Private
 */
exports.deleteAlert = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const alert = await PriceAlert.findOneAndDelete({ _id: id, user: userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    console.error("Delete alert error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting alert",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/v1/alerts/:id/toggle
 * @desc    Toggle alert active status
 * @access  Private
 */
exports.toggleAlert = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const alert = await PriceAlert.findOne({ _id: id, user: userId });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    alert.isActive = !alert.isActive;

    await alert.save();

    await alert.populate([
      { path: "district", select: "name name_gj" },
      { path: "market", select: "name name_gj" },
      { path: "commodity", select: "name name_gj" },
      { path: "variety", select: "name name_gj" },
      { path: "grade", select: "name name_gj" },
    ]);

    res.status(200).json({
      success: true,
      message: `Alert ${alert.isActive ? "activated" : "deactivated"} successfully`,
      data: { alert },
    });
  } catch (error) {
    console.error("Toggle alert error:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling alert",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/v1/alerts/stats
 * @desc    Get alert statistics for user
 * @access  Private
 */
exports.getAlertStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await PriceAlert.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
          },
        },
      },
    ]);

    const result =
      stats.length > 0
        ? stats[0]
        : {
            total: 0,
            active: 0,
            inactive: 0,
          };

    delete result._id;

    res.status(200).json({
      success: true,
      data: { stats: result },
    });
  } catch (error) {
    console.error("Get alert stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching alert statistics",
      error: error.message,
    });
  }
};
