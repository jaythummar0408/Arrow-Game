# API Routes Organization

Complete API route structure for APMC Khetivadi backend.

## 📁 Route Structure

```
routes/
├── index.js                  # Central route index (mounts all routes)
├── syncRoutes.js            # Data synchronization endpoints
└── marketPriceRoutes.js     # Market price query endpoints
```

## 🌐 API Endpoints Overview

### Base URL
```
http://localhost:5000
```

### API Version
```
/api/v1
```

---

## 📍 Root Endpoints

### Welcome/Info
```
GET /
```
Returns API information, version, and available endpoints.

### Health Check
```
GET /health
```
Returns server health status, uptime, and database connection status.

### API Documentation
```
GET /api/v1
```
Returns complete API documentation with all available routes and parameters.

---

## 🔄 Sync API Routes

**Base:** `/api/v1/sync`

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| POST | `/yesterday` | Sync yesterday's data | `{ state: "Gujarat" }` (optional) |
| POST | `/date` | Sync specific date | `{ date: "DD-MM-YYYY", state: "Gujarat" }` |
| GET | `/status` | Get sync status & stats | - |

### Examples:
```bash
# Sync yesterday's data
curl -X POST http://localhost:5000/api/v1/sync/yesterday

# Sync specific date
curl -X POST http://localhost:5000/api/v1/sync/date \
  -H "Content-Type: application/json" \
  -d '{"date":"10-02-2026","state":"Gujarat"}'

# Get sync status
curl http://localhost:5000/api/v1/sync/status
```

---

## 💰 Market Prices API Routes

**Base:** `/api/v1/market-prices`

### Main Query Endpoints

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/` | Query prices with filters | 15+ params (see below) |
| GET | `/stats` | Get statistics | `days`, `state`, `commodity` |

#### Main Query Parameters:
```
Date Filters:
  - days (7/15/30)
  - startDate (YYYY-MM-DD)
  - endDate (YYYY-MM-DD)

Location Filters:
  - state
  - district
  - market

Commodity Filters:
  - commodity
  - commodityCode
  - variety
  - grade

Price Filters:
  - minPrice
  - maxPrice

Sorting:
  - sortBy (arrival_date, modal_price, min_price, max_price)
  - sortOrder (asc, desc)

Pagination:
  - page (default: 1)
  - limit (default: 50, max: 100)

Options:
  - populate (true/false)
```

### Filter & Reference Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/filters` | Get all filter options |
| GET | `/commodities` | Get all commodities |
| GET | `/varieties` | Get all varieties |
| GET | `/grades` | Get all grades |

### Location Hierarchy

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | `/locations/states` | Get all states | - |
| GET | `/locations/districts/:state` | Get districts by state | `:state` |
| GET | `/locations/markets/:district` | Get markets by district | `:district` |

### Examples:
```bash
# Get last 7 days data
curl "http://localhost:5000/api/v1/market-prices?days=7&limit=10"

# Get wheat prices sorted by price
curl "http://localhost:5000/api/v1/market-prices?commodity=Wheat&sortBy=modal_price&sortOrder=desc"

# Get statistics
curl "http://localhost:5000/api/v1/market-prices/stats?days=30"

# Get filter options
curl "http://localhost:5000/api/v1/market-prices/filters"

# Get districts in Gujarat
curl "http://localhost:5000/api/v1/market-prices/locations/districts/Gujarat"

# Get markets in Ahmedabad
curl "http://localhost:5000/api/v1/market-prices/locations/markets/Ahmedabad"
```

---

## 🎯 Route Organization Best Practices

### 1. RESTful Structure
All routes follow REST principles:
- GET for retrieving data
- POST for creating/syncing data
- Logical resource hierarchy

### 2. Clear Grouping
Routes are organized by functionality:
- **Sync routes**: Data synchronization operations
- **Market price routes**: Query and filter operations
- **Location routes**: Hierarchical location data
- **Reference routes**: Master data (commodities, varieties, grades)

### 3. Consistent Naming
- Use plural nouns for collections (`/commodities`, `/markets`)
- Use hierarchical paths (`/locations/districts/:state`)
- Use query parameters for filters (`?days=7&state=Gujarat`)

### 4. Documentation
Each route has:
- Method and path
- Description
- Query parameters or body schema
- Access level
- Example usage

---

## 🔧 Adding New Routes

### Step 1: Create Controller Function
```javascript
// controllers/yourController.js
exports.yourFunction = async (req, res) => {
  try {
    // Your logic
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Step 2: Add Route Definition
```javascript
// routes/yourRoutes.js
const express = require("express");
const router = express.Router();
const yourController = require("../controllers/yourController");

/**
 * @route   GET /api/v1/your-route
 * @desc    Description
 * @access  Public
 */
router.get("/", yourController.yourFunction);

module.exports = router;
```

### Step 3: Register in Route Index
```javascript
// routes/index.js
const yourRoutes = require("./yourRoutes");

router.use("/your-route", yourRoutes);
```

---

## 🧪 Testing Routes

### Test Individual Route
```bash
# Using curl
curl http://localhost:5000/api/v1/market-prices/filters

# Using httpie
http GET http://localhost:5000/api/v1/market-prices/filters
```

### Test with Postman
1. Import collection
2. Set base URL: `http://localhost:5000`
3. Test each endpoint

### Test Script
```javascript
// scripts/testRoutes.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testRoutes() {
  // Test root
  const root = await axios.get(`${BASE_URL}/`);
  console.log('Root:', root.data);

  // Test health
  const health = await axios.get(`${BASE_URL}/health`);
  console.log('Health:', health.data);

  // Test API docs
  const docs = await axios.get(`${BASE_URL}/api/v1`);
  console.log('API Docs:', docs.data);
}

testRoutes();
```

---

## 📊 Route Performance

### Optimized Routes
- Indexed queries for fast retrieval
- Pagination to limit response size
- Optional population to reduce data transfer
- Caching for frequently accessed data

### Performance Tips
1. **Use pagination**: `?page=1&limit=50`
2. **Disable populate**: `?populate=false` for faster responses
3. **Use specific filters**: More filters = faster queries
4. **Use smaller date ranges**: `?days=7` instead of `?days=30`

---

## 🔒 Future Enhancements

### Authentication Routes (Coming Soon)
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/auth/profile
```

### Admin Routes (Coming Soon)
```
GET    /api/v1/admin/users
POST   /api/v1/admin/users
DELETE /api/v1/admin/users/:id
```

### Export Routes (Coming Soon)
```
GET /api/v1/export/csv
GET /api/v1/export/excel
GET /api/v1/export/pdf
```

---

## 📚 Related Documentation

- [Master API Guide](../MASTER_API_GUIDE.md) - Complete API usage documentation
- [Sync API Guide](../SYNC_API_GUIDE.md) - Data synchronization guide
- [Deployment Guide](../DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [Quick Reference](../QUICK_REFERENCE.md) - Command cheat sheet

---

**Last Updated:** February 11, 2026
