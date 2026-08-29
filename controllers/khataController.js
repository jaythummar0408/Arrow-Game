const { KhataTransaction } = require("../models");

/**
 * Helper: Build date filter based on period keyword
 */
const getDateFilter = (filter, startDate, endDate) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Custom date range takes priority
  if (startDate && endDate) {
    return {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    };
  }

  switch (filter) {
    case "today":
      return { $gte: todayStart };

    case "week": {
      const weekAgo = new Date(todayStart);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { $gte: weekAgo };
    }

    case "month":
      return {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };

    case "season": {
      // Indian farming seasons:
      // Kharif: June (5) – October (9)
      // Rabi: November (10) – March (2)
      // Zaid: March (2) – June (5)
      const month = now.getMonth(); // 0-indexed
      let seasonStart, seasonEnd;

      if (month >= 5 && month <= 9) {
        // Kharif season: June 1 – October 31
        seasonStart = new Date(now.getFullYear(), 5, 1);
        seasonEnd = new Date(now.getFullYear(), 9, 31, 23, 59, 59, 999);
      } else if (month >= 10 || month <= 1) {
        // Rabi season: November 1 – February 28/29
        const year = month >= 10 ? now.getFullYear() : now.getFullYear() - 1;
        seasonStart = new Date(year, 10, 1);
        seasonEnd = new Date(year + 1, 1, 28, 23, 59, 59, 999); // Feb end
      } else {
        // Zaid season: March 1 – May 31
        seasonStart = new Date(now.getFullYear(), 2, 1);
        seasonEnd = new Date(now.getFullYear(), 4, 31, 23, 59, 59, 999);
      }

      return { $gte: seasonStart, $lte: seasonEnd };
    }

    case "all":
    default:
      return null; // No date filter
  }
};

/**
 * POST /api/v1/khata/transactions
 * Create a new expense or income transaction
 */
exports.createTransaction = async (req, res) => {
  try {
    const { type, category, amount, date, note } = req.body;

    // Validate required fields
    if (!type || !category || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, category, amount, date",
      });
    }

    // Validate type
    if (!["expense", "income"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'expense' or 'income'",
      });
    }

    // Validate category against type
    const validCategories = KhataTransaction.getCategories(type);
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category '${category}' for type '${type}'. Valid categories: ${validCategories.join(", ")}`,
      });
    }

    const transaction = await KhataTransaction.create({
      userId: req.user.userId,
      type,
      category,
      amount: parseFloat(amount),
      date: new Date(date),
      note: note || "",
    });

    res.status(201).json({
      success: true,
      message: `${type === "expense" ? "Expense" : "Income"} added successfully`,
      data: transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/khata/transactions
 * List transactions with filters, pagination, and sorting
 */
exports.getTransactions = async (req, res) => {
  try {
    const {
      type,
      filter = "all",
      startDate,
      endDate,
      category,
      page = 1,
      limit = 50,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { userId: req.user.userId };

    if (type && ["expense", "income"].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    // Date filter
    const dateFilter = getDateFilter(filter, startDate, endDate);
    if (dateFilter) {
      query.date = dateFilter;
    }

    // Sorting
    const validSortFields = ["date", "amount", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "date";
    const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [transactions, total] = await Promise.all([
      KhataTransaction.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      KhataTransaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

/**
 * PUT /api/v1/khata/transactions/:id
 * Update an existing transaction (ownership check)
 */
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, date, note } = req.body;

    // Find transaction and verify ownership
    const transaction = await KhataTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own transactions",
      });
    }

    // Validate category if being updated
    if (category) {
      const validCategories = KhataTransaction.getCategories(transaction.type);
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category '${category}' for type '${transaction.type}'`,
        });
      }
      transaction.category = category;
    }

    if (amount !== undefined) transaction.amount = parseFloat(amount);
    if (date) transaction.date = new Date(date);
    if (note !== undefined) transaction.note = note;

    await transaction.save();

    res.json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update transaction",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/v1/khata/transactions/:id
 * Delete a transaction (ownership check)
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await KhataTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own transactions",
      });
    }

    await KhataTransaction.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/khata/summary
 * Get aggregated dashboard stats for the logged-in user
 */
exports.getSummary = async (req, res) => {
  try {
    const { filter = "all", startDate, endDate } = req.query;

    // Build match stage
    const matchStage = {
      userId: require("mongoose").Types.ObjectId.createFromHexString(req.user.userId),
    };

    const dateFilter = getDateFilter(filter, startDate, endDate);
    if (dateFilter) {
      matchStage.date = dateFilter;
    }

    // Aggregation pipeline for totals
    const totalsResult = await KhataTransaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Parse totals
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    totalsResult.forEach((item) => {
      if (item._id === "income") {
        totalIncome = item.total;
        incomeCount = item.count;
      } else if (item._id === "expense") {
        totalExpense = item.total;
        expenseCount = item.count;
      }
    });

    // Aggregation pipeline for category-wise breakdown
    const categoryBreakdown = await KhataTransaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { type: "$type", category: "$category" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Parse category breakdowns
    const expenseByCategory = [];
    const incomeByCategory = [];

    categoryBreakdown.forEach((item) => {
      const entry = {
        category: item._id.category,
        total: item.total,
        count: item.count,
        percentage: 0,
      };

      if (item._id.type === "expense") {
        entry.percentage =
          totalExpense > 0
            ? parseFloat(((item.total / totalExpense) * 100).toFixed(1))
            : 0;
        expenseByCategory.push(entry);
      } else if (item._id.type === "income") {
        entry.percentage =
          totalIncome > 0
            ? parseFloat(((item.total / totalIncome) * 100).toFixed(1))
            : 0;
        incomeByCategory.push(entry);
      }
    });

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        incomeCount,
        expenseCount,
        expenseByCategory,
        incomeByCategory,
      },
    });
  } catch (error) {
    console.error("Get summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get summary",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/khata/categories
 * Get valid categories for expense and income
 */
exports.getCategories = (req, res) => {
  res.json({
    success: true,
    data: {
      expense: KhataTransaction.getCategories("expense"),
      income: KhataTransaction.getCategories("income"),
    },
  });
};
