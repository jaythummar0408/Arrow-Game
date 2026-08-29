const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const tractorController = require("../controllers/tractorController");

/**
 * Tractor Work Routes
 * All routes are protected by JWT authentication
 *
 * ── Customers ──
 * GET    /api/v1/tractor/customers      - List all customers
 * POST   /api/v1/tractor/customers      - Add a new customer
 * DELETE /api/v1/tractor/customers/:id  - Delete customer + cascade works
 *
 * ── Works ──
 * GET    /api/v1/tractor/works          - List all works (optionally filter by customerId)
 * POST   /api/v1/tractor/works          - Add a new work entry
 * PUT    /api/v1/tractor/works/:id      - Update a work entry
 * DELETE /api/v1/tractor/works/:id      - Delete a single work
 *
 * ── Summary ──
 * GET    /api/v1/tractor/summary        - Get monthly income + pending totals
 */

// All tractor routes require authentication
router.use(verifyToken);

// Customer CRUD
router.get("/customers", tractorController.getCustomers);
router.post("/customers", tractorController.addCustomer);
router.delete("/customers/:id", tractorController.deleteCustomer);

// Work CRUD
router.get("/works", tractorController.getWorks);
router.post("/works", tractorController.addWork);
router.put("/works/:id", tractorController.updateWork);
router.delete("/works/:id", tractorController.deleteWork);

// Summary
router.get("/summary", tractorController.getSummary);

module.exports = router;
