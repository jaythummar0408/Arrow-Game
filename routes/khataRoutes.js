const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const khataController = require("../controllers/khataController");

/**
 * Khata (Expense/Income) Routes
 * All routes are protected by JWT authentication
 *
 * POST   /api/v1/khata/transactions      - Create a new transaction
 * GET    /api/v1/khata/transactions      - List transactions (with filters)
 * PUT    /api/v1/khata/transactions/:id  - Update a transaction
 * DELETE /api/v1/khata/transactions/:id  - Delete a transaction
 * GET    /api/v1/khata/summary           - Get dashboard summary stats
 * GET    /api/v1/khata/categories        - Get valid category lists
 */

// All khata routes require authentication
router.use(verifyToken);

// Transaction CRUD
router.post("/transactions", khataController.createTransaction);
router.get("/transactions", khataController.getTransactions);
router.put("/transactions/:id", khataController.updateTransaction);
router.delete("/transactions/:id", khataController.deleteTransaction);

// Summary & categories
router.get("/summary", khataController.getSummary);
router.get("/categories", khataController.getCategories);

module.exports = router;
