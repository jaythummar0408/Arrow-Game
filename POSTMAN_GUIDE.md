# Postman Collection Import Guide

Quick guide to import and use the APMC Khetivadi API collection in Postman.

## 📥 How to Import

### Method 1: Import File
1. Open **Postman**
2. Click **Import** button (top left)
3. Click **Upload Files**
4. Select `APMC_Khetivadi_API.postman_collection.json`
5. Click **Import**

### Method 2: Drag & Drop
1. Open **Postman**
2. Drag `APMC_Khetivadi_API.postman_collection.json` into Postman window
3. Collection will be imported automatically

---

## 📂 Collection Structure

After import, you'll see this structure:

```
APMC Khetivadi API
├── Root & Health (3 requests)
│   ├── Root - API Info
│   ├── Health Check
│   └── API Documentation
├── Sync API (3 requests)
│   ├── Sync Yesterday Data
│   ├── Sync Specific Date
│   └── Get Sync Status
├── Market Prices - Query (7 requests)
│   ├── Get Market Prices (All Filters)
│   ├── Last 7 Days - Gujarat
│   ├── Wheat Prices - Sorted by Price
│   ├── Price Range Filter (₹5000-7000)
│   ├── Specific District - Ahmedabad
│   ├── Custom Date Range
│   └── Without Population (Fast)
├── Market Prices - Stats (3 requests)
│   ├── Get Statistics
│   ├── Stats - Last 7 Days
│   └── Stats - Wheat Only
├── Market Prices - Filters (4 requests)
│   ├── Get All Filter Options
│   ├── Get All Commodities
│   ├── Get All Varieties
│   └── Get All Grades
└── Market Prices - Locations (3 requests)
    ├── Get All States
    ├── Get Districts by State
    └── Get Markets by District
```

**Total:** 23 pre-configured API requests

---

## ⚙️ Environment Variable

The collection uses a variable:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `{{base_url}}` | http://localhost:5000 | Server base URL |

### To Change Base URL:

**For Production:**
1. In Postman, go to **Environments**
2. Create new environment: "APMC Production"
3. Add variable:
   - Variable: `base_url`
   - Initial Value: `https://your-domain.com`
   - Current Value: `https://your-domain.com`
4. Select environment from dropdown (top right)

**Quick Edit:**
1. Click collection name → **Variables** tab
2. Change `base_url` value
3. Save

---

## 🚀 Quick Start Guide

### Step 1: Start Server
```bash
npm run dev
```

### Step 2: Test Health
1. Open **"Root & Health"** folder
2. Click **"Health Check"**
3. Click **Send**
4. Should see: `"status": "healthy"`

### Step 3: Check Sync Status
1. Open **"Sync API"** folder
2. Click **"Get Sync Status"**
3. Click **Send**
4. See database statistics

### Step 4: Query Market Prices
1. Open **"Market Prices - Query"** folder
2. Click **"Last 7 Days - Gujarat"**
3. Click **Send**
4. View price data

---

## 💡 Using Query Parameters

### Example: Get Market Prices (All Filters)

This request has **15 query parameters**. Enable/disable as needed:

1. Click **"Get Market Prices (All Filters)"**
2. Go to **Params** tab
3. Enable/disable checkboxes:
   - ✅ Enabled = included in request
   - ⬜ Disabled = excluded from request

**Available Parameters:**
```
✅ days = 7          # Date range
⬜ startDate         # Custom start (disabled)
⬜ endDate           # Custom end (disabled)
✅ state = Gujarat   # Location filter
⬜ district          # Sub-location (disabled)
⬜ market            # Specific market (disabled)
⬜ commodity         # Filter by commodity (disabled)
⬜ commodityCode     # Filter by code (disabled)
⬜ variety           # Variety filter (disabled)
⬜ grade             # Grade filter (disabled)
⬜ minPrice          # Price range min (disabled)
⬜ maxPrice          # Price range max (disabled)
✅ sortBy = arrival_date   # Sort field
✅ sortOrder = desc        # Sort direction
✅ page = 1                # Pagination
✅ limit = 10              # Results per page
✅ populate = true         # Include refs
```

**To customize:**
1. Enable desired params
2. Change values
3. Click **Send**

---

## 📋 Common Workflows

### Workflow 1: First Time Setup
```
1. Health Check → Verify server is running
2. Get Sync Status → Check if data exists
3. Sync Yesterday Data → Import data (if empty)
4. Get Sync Status → Verify data imported
5. Get Market Prices → Query data
```

### Workflow 2: Daily Data Update
```
1. Sync Yesterday Data → Import latest data
2. Get Statistics → View updated stats
3. Get Market Prices → Query new data
```

### Workflow 3: Building Frontend Dropdowns
```
1. Get All Filter Options → Get all dropdown data
OR use specific endpoints:
2. Get All States → Populate state dropdown
3. Get Districts by State → Populate district dropdown
4. Get Markets by District → Populate market dropdown
5. Get All Commodities → Populate commodity dropdown
6. Get All Varieties → Populate variety dropdown
7. Get All Grades → Populate grade dropdown
```

### Workflow 4: Price Comparison
```
1. Wheat Prices - Sorted by Price → See highest/lowest
2. Price Range Filter → Find prices in range
3. Specific District → Compare by location
4. Get Statistics → Overall analysis
```

---

## 🎯 Request Examples

### Example 1: Sync Data

**Request:** POST Sync Yesterday Data
```json
{
    "state": "Gujarat"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Data synced successfully",
    "date": "10-02-2026",
    "state": "Gujarat",
    "inserted": 884,
    "updated": 0,
    "errors": 0
}
```

### Example 2: Query Prices

**Request:** GET Market Prices
```
/api/v1/market-prices?days=7&state=Gujarat&limit=10
```

**Response:**
```json
{
    "success": true,
    "count": 10,
    "pagination": {
        "currentPage": 1,
        "totalPages": 481,
        "totalRecords": 4803,
        "hasNext": true,
        "hasPrev": false
    },
    "data": [ /* market price records */ ]
}
```

### Example 3: Get Statistics

**Request:** GET Statistics
```
/api/v1/market-prices/stats?days=30
```

**Response:**
```json
{
    "success": true,
    "overallStats": {
        "totalRecords": 21940,
        "avgModalPrice": 4846,
        "minModalPrice": 200,
        "maxModalPrice": 30840
    },
    "topCommodities": [ /* top 10 */ ],
    "topMarkets": [ /* top 10 */ ]
}
```

---

## 🔧 Tips & Tricks

### Tip 1: Save Responses
- Click **Save Response** → **Save as Example**
- Use for documentation or comparison

### Tip 2: Tests Tab
Add automatic tests:
```javascript
// Test status code
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Has success field", function () {
    pm.expect(pm.response.json()).to.have.property('success');
});
```

### Tip 3: Pre-request Scripts
Auto-set current date:
```javascript
// For Sync Specific Date
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const day = String(yesterday.getDate()).padStart(2, '0');
const month = String(yesterday.getMonth() + 1).padStart(2, '0');
const year = yesterday.getFullYear();

pm.collectionVariables.set("yesterday_date", `${day}-${month}-${year}`);
```

### Tip 4: Organize Collections
- Use **folders** for grouping
- Use **examples** for different scenarios
- Use **descriptions** for documentation

### Tip 5: Bulk Operations
- Select multiple requests
- Right-click → **Run**
- Use **Collection Runner**

---

## 🐛 Troubleshooting

### Issue: Connection Refused
**Solution:**
1. Check server is running: `npm run dev`
2. Verify port: http://localhost:5000
3. Check `base_url` variable

### Issue: 404 Not Found
**Solution:**
1. Check endpoint path
2. Verify API version: `/api/v1`
3. Check route is mounted in server.js

### Issue: Empty Response
**Solution:**
1. Check database has data: **Get Sync Status**
2. Sync data if empty: **Sync Yesterday Data**
3. Adjust filters (may be too restrictive)

### Issue: Timeout
**Solution:**
1. Increase timeout: Settings → Request timeout
2. Use smaller `limit` parameter
3. Disable `populate=false` for faster queries

---

## 📊 Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Request successful |
| 400 | Bad Request | Check parameters |
| 404 | Not Found | Check endpoint URL |
| 500 | Server Error | Check server logs |

---

## 🎓 Learning Resources

### Postman Features to Explore:
1. **Collections** - Organization
2. **Environments** - Multi-server support
3. **Variables** - Reusable values
4. **Tests** - Automated validation
5. **Pre-request Scripts** - Dynamic data
6. **Collection Runner** - Batch testing
7. **Mock Servers** - Frontend development
8. **Documentation** - Auto-generate docs
9. **Monitoring** - Scheduled runs
10. **Workspaces** - Team collaboration

---

## 📚 Related Documentation

- **Main README:** [README.md](README.md)
- **Master API Guide:** [MASTER_API_GUIDE.md](MASTER_API_GUIDE.md)
- **Sync API Guide:** [SYNC_API_GUIDE.md](SYNC_API_GUIDE.md)
- **Routes README:** [routes/README.md](routes/README.md)

---

## ✅ Quick Checklist

Before testing:
- [ ] Server is running (npm run dev)
- [ ] Database is connected (check /health)
- [ ] Data is synced (check /api/v1/sync/status)
- [ ] Postman collection imported
- [ ] base_url variable is correct

Ready to test! 🚀

---

**Collection Version:** 1.0.0  
**Last Updated:** February 11, 2026  
**Total Requests:** 23
