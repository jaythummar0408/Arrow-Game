const { TractorCustomer, TractorWork } = require("../models");

// ─── CUSTOMER ENDPOINTS ────────────────────────────────────────────────────

/**
 * GET /api/v1/tractor/customers
 * List all customers for the logged-in user
 */
exports.getCustomers = async (req, res) => {
  try {
    const customers = await TractorCustomer.find({ ownerId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: customers });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch customers" });
  }
};

/**
 * POST /api/v1/tractor/customers
 * Add a new customer
 */
exports.addCustomer = async (req, res) => {
  try {
    const { name, mobile, village } = req.body;

    if (!name || !mobile || !village) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, mobile, village",
      });
    }

    // Check for duplicate (same owner + name + mobile)
    const existing = await TractorCustomer.findOne({
      ownerId: req.user.userId,
      name: name.trim(),
      mobile: mobile.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Customer with this name and mobile already exists",
      });
    }

    const customer = await TractorCustomer.create({
      ownerId: req.user.userId,
      name: name.trim(),
      mobile: mobile.trim(),
      village: village.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Add customer error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Customer with this name and mobile already exists",
      });
    }

    res.status(500).json({ success: false, message: "Failed to add customer" });
  }
};

/**
 * DELETE /api/v1/tractor/customers/:id
 * Delete a customer AND all their works (cascade)
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await TractorCustomer.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.userId,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Cascade: delete all works for this customer
    const deleteResult = await TractorWork.deleteMany({
      ownerId: req.user.userId,
      customerId: customer._id,
    });

    res.json({
      success: true,
      message: "Customer and all works deleted",
      worksDeleted: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({ success: false, message: "Failed to delete customer" });
  }
};

// ─── WORK ENDPOINTS ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/tractor/works
 * List all works, optionally filtered by customerId
 */
exports.getWorks = async (req, res) => {
  try {
    const query = { ownerId: req.user.userId };

    if (req.query.customerId) {
      query.customerId = req.query.customerId;
    }

    const works = await TractorWork.find(query)
      .sort({ workDate: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: works });
  } catch (error) {
    console.error("Get works error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch works" });
  }
};

/**
 * POST /api/v1/tractor/works
 * Add a new work entry
 */
exports.addWork = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerMobile,
      village,
      machine,
      areaOrHours,
      rateType,
      rate,
      totalAmount,
      paidAmount,
      pendingAmount,
      paymentStatus,
      workDate,
      note,
    } = req.body;

    if (!customerId || !customerName || !machine || !areaOrHours || !rate || !workDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify the customer belongs to this user
    const customer = await TractorCustomer.findOne({
      _id: customerId,
      ownerId: req.user.userId,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Auto-generate invoice number
    const timestamp = new Date().getTime().toString().slice(-4);
    const random = Math.floor(10 + Math.random() * 90);
    const invoiceNumber = `INV-${timestamp}${random}`;

    const work = await TractorWork.create({
      ownerId: req.user.userId,
      customerId,
      customerName: customerName.trim(),
      customerMobile: customerMobile || customer.mobile,
      village: village || customer.village,
      machine,
      areaOrHours: parseFloat(areaOrHours),
      rateType: rateType || "bigha",
      rate: parseFloat(rate),
      totalAmount: parseFloat(totalAmount) || parseFloat(areaOrHours) * parseFloat(rate),
      paidAmount: parseFloat(paidAmount) || 0,
      pendingAmount: parseFloat(pendingAmount) || 0,
      paymentStatus: paymentStatus || "pending",
      workDate: new Date(workDate),
      note: note || "",
      invoiceNumber,
    });

    res.status(201).json({
      success: true,
      message: "Work added successfully",
      data: work,
    });
  } catch (error) {
    console.error("Add work error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    res.status(500).json({ success: false, message: "Failed to add work" });
  }
};

/**
 * PUT /api/v1/tractor/works/:id
 * Update an existing work entry
 */
exports.updateWork = async (req, res) => {
  try {
    const allowedUpdates = [
      "customerName",
      "customerMobile",
      "village",
      "machine",
      "areaOrHours",
      "rateType",
      "rate",
      "totalAmount",
      "paidAmount",
      "pendingAmount",
      "paymentStatus",
      "workDate",
      "note",
    ];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Parse numeric fields
    if (updates.areaOrHours) updates.areaOrHours = parseFloat(updates.areaOrHours);
    if (updates.rate) updates.rate = parseFloat(updates.rate);
    if (updates.totalAmount) updates.totalAmount = parseFloat(updates.totalAmount);
    if (updates.paidAmount !== undefined) updates.paidAmount = parseFloat(updates.paidAmount);
    if (updates.pendingAmount !== undefined) updates.pendingAmount = parseFloat(updates.pendingAmount);
    if (updates.workDate) updates.workDate = new Date(updates.workDate);

    const work = await TractorWork.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!work) {
      return res.status(404).json({ success: false, message: "Work not found" });
    }

    res.json({
      success: true,
      message: "Work updated successfully",
      data: work,
    });
  } catch (error) {
    console.error("Update work error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    res.status(500).json({ success: false, message: "Failed to update work" });
  }
};

/**
 * DELETE /api/v1/tractor/works/:id
 * Delete a single work entry
 */
exports.deleteWork = async (req, res) => {
  try {
    const work = await TractorWork.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.userId,
    });

    if (!work) {
      return res.status(404).json({ success: false, message: "Work not found" });
    }

    res.json({
      success: true,
      message: "Work deleted successfully",
    });
  } catch (error) {
    console.error("Delete work error:", error);
    res.status(500).json({ success: false, message: "Failed to delete work" });
  }
};

// ─── SUMMARY ENDPOINT ───────────────────────────────────────────────────────

/**
 * GET /api/v1/tractor/summary
 * Get monthly income + total pending for the header
 */
exports.getSummary = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const ownerObjectId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Monthly paid income (this month)
    const monthlyAgg = await TractorWork.aggregate([
      {
        $match: {
          ownerId: ownerObjectId,
          workDate: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$paidAmount" },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Total pending across ALL works
    const pendingAgg = await TractorWork.aggregate([
      {
        $match: {
          ownerId: ownerObjectId,
          pendingAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$pendingAmount" },
        },
      },
    ]);

    // Total customers count
    const customerCount = await TractorCustomer.countDocuments({
      ownerId: req.user.userId,
    });

    res.json({
      success: true,
      data: {
        monthlyIncome: monthlyAgg[0]?.totalPaid || 0,
        monthlyTotal: monthlyAgg[0]?.totalAmount || 0,
        totalPending: pendingAgg[0]?.totalPending || 0,
        customerCount,
      },
    });
  } catch (error) {
    console.error("Tractor summary error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch summary" });
  }
};

