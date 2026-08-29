# Master Market Prices API Documentation

## 🎯 Overview

Comprehensive API for querying market price data with advanced filtering, sorting, pagination, and statistics. Covers last 30 days of data (excluding current day) with options for 7, 15, or 30-day ranges.

## ✅ Test Results

- **Total Records in DB:** 21,940
- **Date Range:** Last 30 days
- **States:** 1 (Gujarat)
- **Districts:** 30
- **Markets:** 160+
- **Commodities:** 119
- **Varieties:** 185
- **Grades:** 11

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api/v1/market-prices
```

---

## 1️⃣ Get Market Prices (Main Endpoint)

**Endpoint:** `GET /api/v1/market-prices`

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Date range: 7, 15, or 30 days |
| `startDate` | string | - | Custom start date (YYYY-MM-DD) |
| `endDate` | string | - | Custom end date (YYYY-MM-DD) |
| `state` | string | - | Filter by state name |
| `district` | string | - | Filter by district name |
| `market` | string | - | Filter by market name |
| `commodity` | string | - | Filter by commodity name |
| `commodityCode` | number | - | Filter by commodity code |
| `variety` | string | - | Filter by variety name |
| `grade` | string | - | Filter by grade name |
| `minPrice` | number | - | Minimum modal price |
| `maxPrice` | number | - | Maximum modal price |
| `sortBy` | string | arrival_date | Sort field: arrival_date, modal_price, min_price, max_price |
| `sortOrder` | string | desc | Sort order: asc, desc |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Records per page (max 100) |
| `populate` | string | true | Populate references: true, false |

### Example Requests

#### 1. Last 7 Days - Gujarat
```bash
GET /api/v1/market-prices?days=7&state=Gujarat&populate=true&limit=10
```

#### 2. Last 15 Days - Specific Commodity
```bash
GET /api/v1/market-prices?days=15&commodity=Soyabean&sortBy=modal_price&sortOrder=desc
```

#### 3. Last 30 Days - District Filter
```bash
GET /api/v1/market-prices?days=30&state=Gujarat&district=Amreli&populate=true
```

#### 4. Price Range Filter
```bash
GET /api/v1/market-prices?days=30&minPrice=5000&maxPrice=7000&sortBy=modal_price
```

#### 5. Custom Date Range
```bash
GET /api/v1/market-prices?startDate=2026-02-01&endDate=2026-02-10&populate=true
```

#### 6. Multiple Filters
```bash
GET /api/v1/market-prices?days=30&state=Gujarat&commodity=Wheat&variety=Lokvan&grade=FAQ
```

### Response Format

```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "currentPage": 1,
    "totalPages": 481,
    "totalRecords": 4803,
    "limit": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "days": "7",
    "dateRange": {
      "$gte": "2026-02-04T00:00:00.000Z",
      "$lte": "2026-02-10T00:00:00.000Z"
    },
    "state": "Gujarat"
  },
  "data": [
    {
      "_id": "...",
      "state": {
        "_id": "...",
        "name": "Gujarat"
      },
      "district": {
        "_id": "...",
        "name": "Rajkot"
      },
      "market": {
        "_id": "...",
        "name": "Gondal(Veg.market Gondal) APMC"
      },
      "commodity": {
        "_id": "...",
        "name": "Pumpkin",
        "commodity_code": 305
      },
      "variety": {
        "_id": "...",
        "name": "Pumpkin"
      },
      "grade": {
        "_id": "...",
        "name": "Local"
      },
      "arrival_date": "2026-02-09T00:00:00.000Z",
      "min_price": 1000,
      "max_price": 1200,
      "modal_price": 1100,
      "createdAt": "2026-02-11T...",
      "updatedAt": "2026-02-11T..."
    }
  ]
}
```

---

## 2️⃣ Get Statistics

**Endpoint:** `GET /api/v1/market-prices/stats`

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Date range: 7, 15, or 30 days |
| `state` | string | - | Filter by state |
| `commodity` | string | - | Filter by commodity |

### Example Request

```bash
GET /api/v1/market-prices/stats?days=30&state=Gujarat
```

### Response Format

```json
{
  "success": true,
  "dateRange": {
    "startDate": "2026-01-12T00:00:00.000Z",
    "endDate": "2026-02-10T00:00:00.000Z",
    "days": 30
  },
  "overallStats": {
    "totalRecords": 21940,
    "avgModalPrice": 4846,
    "minModalPrice": 200,
    "maxModalPrice": 30840,
    "avgMinPrice": 4632,
    "avgMaxPrice": 5059
  },
  "topCommodities": [
    {
      "commodity": "Wheat",
      "commodityCode": 4,
      "count": 1419,
      "avgPrice": 2571.28
    },
    {
      "commodity": "Cotton",
      "commodityCode": 11,
      "count": 1139,
      "avgPrice": 7432.39
    }
  ],
  "topMarkets": [
    {
      "market": "Surat APMC",
      "count": 890
    },
    {
      "market": "Dahod(Veg. Market) APMC",
      "count": 785
    }
  ]
}
```

---

## 3️⃣ Get Filter Options

**Endpoint:** `GET /api/v1/market-prices/filters`

Get all available filter values for dropdown menus.

### Example Request

```bash
GET /api/v1/market-prices/filters
```

### Response Format

```json
{
  "success": true,
  "filters": {
    "states": ["Gujarat"],
    "commodities": [
      {
        "name": "Wheat",
        "code": 4
      },
      {
        "name": "Soyabean",
        "code": 13
      }
    ],
    "varieties": ["Local", "Other", "FAQ", ...],
    "grades": ["FAQ", "Local", "Grade A", ...],
    "dateRanges": [
      { "label": "Last 7 Days", "value": 7 },
      { "label": "Last 15 Days", "value": 15 },
      { "label": "Last 30 Days", "value": 30 }
    ]
  }
}
```

---

## 4️⃣ Get Districts by State

**Endpoint:** `GET /api/v1/market-prices/districts/:state`

Get all districts in a state.

### Example Request

```bash
GET /api/v1/market-prices/districts/Gujarat
```

### Response Format

```json
{
  "success": true,
  "state": "Gujarat",
  "count": 30,
  "districts": [
    "Ahmedabad",
    "Amreli",
    "Anand",
    "Banaskanth",
    ...
  ]
}
```

---

## 5️⃣ Get Markets by District

**Endpoint:** `GET /api/v1/market-prices/markets/:district`

Get all markets in a district.

### Example Request

```bash
GET /api/v1/market-prices/markets/Amreli
```

### Response Format

```json
{
  "success": true,
  "state": "Gujarat",
  "district": "Amreli",
  "count": 3,
  "markets": [
    "Amreli APMC",
    "Bagasara APMC",
    "Dhari APMC"
  ]
}
```

---

## 🔧 Advanced Usage Examples

### Example 1: Daily Price Tracking
Get prices for specific commodity over last 7 days:
```bash
curl "http://localhost:5000/api/v1/market-prices?days=7&commodity=Wheat&sortBy=arrival_date&sortOrder=asc&populate=true"
```

### Example 2: Market Comparison
Compare prices across markets for same commodity:
```bash
curl "http://localhost:5000/api/v1/market-prices?days=15&commodity=Soyabean&state=Gujarat&sortBy=modal_price&sortOrder=desc&limit=20"
```

### Example 3: Price Range Analysis
Find affordable options:
```bash
curl "http://localhost:5000/api/v1/market-prices?days=30&commodity=Onion&maxPrice=3000&sortBy=modal_price&sortOrder=asc"
```

### Example 4: Pagination
Navigate through large datasets:
```bash
# Page 1
curl "http://localhost:5000/api/v1/market-prices?days=30&page=1&limit=50"

# Page 2
curl "http://localhost:5000/api/v1/market-prices?days=30&page=2&limit=50"
```

### Example 5: Without Population (Faster)
Get only IDs (faster response):
```bash
curl "http://localhost:5000/api/v1/market-prices?days=7&populate=false&limit=100"
```

---

## 📊 Use Cases

### 1. Dashboard Overview
```javascript
// Get last 7 days statistics
const stats = await axios.get('/api/v1/market-prices/stats?days=7');

// Get top commodities
const topCommodities = stats.data.topCommodities;
const topMarkets = stats.data.topMarkets;
```

### 2. Search/Filter Interface
```javascript
// Get filter options for dropdowns
const filters = await axios.get('/api/v1/market-prices/filters');

// Populate dropdowns
const states = filters.data.filters.states;
const commodities = filters.data.filters.commodities;
```

### 3. Price Comparison
```javascript
// Compare prices for commodity across markets
const prices = await axios.get('/api/v1/market-prices', {
  params: {
    days: 15,
    commodity: 'Wheat',
    sortBy: 'modal_price',
    sortOrder: 'asc',
    limit: 20
  }
});
```

### 4. Location Hierarchy
```javascript
// Step 1: Get all states
const filters = await axios.get('/api/v1/market-prices/filters');
const states = filters.data.filters.states;

// Step 2: Get districts for selected state
const districts = await axios.get('/api/v1/market-prices/districts/Gujarat');

// Step 3: Get markets for selected district
const markets = await axios.get('/api/v1/market-prices/markets/Ahmedabad');
```

---

## 🎯 Frontend Integration Examples

### React Example
```javascript
import axios from 'axios';

const MarketPrices = () => {
  const [prices, setPrices] = useState([]);
  const [filters, setFilters] = useState({
    days: 7,
    state: 'Gujarat',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    const fetchPrices = async () => {
      const response = await axios.get('/api/v1/market-prices', {
        params: filters
      });
      setPrices(response.data.data);
    };
    fetchPrices();
  }, [filters]);

  return (
    <div>
      {/* Render prices */}
    </div>
  );
};
```

### Vue Example
```javascript
export default {
  data() {
    return {
      prices: [],
      filters: {
        days: 7,
        commodity: 'Wheat'
      }
    };
  },
  async mounted() {
    const response = await this.$axios.get('/api/v1/market-prices', {
      params: this.filters
    });
    this.prices = response.data.data;
  }
};
```

---

## 📈 Performance Tips

1. **Use Pagination:** Don't fetch all records at once
   ```bash
   ?limit=50&page=1
   ```

2. **Disable Population:** When you don't need full details
   ```bash
   ?populate=false
   ```

3. **Specific Date Ranges:** Use smaller date ranges when possible
   ```bash
   ?days=7  # Instead of days=30
   ```

4. **Index Optimization:** Queries on indexed fields are faster
   - State, District, Market, Commodity (indexed)
   - Arrival Date (indexed)
   - Modal Price (not indexed - slower sorting)

---

## ⚠️ Important Notes

1. **Date Range:** Excludes current day, includes last N days
2. **Case Insensitive:** All text filters are case-insensitive
3. **Partial Match:** Name filters use RegEx for partial matching
4. **Max Limit:** Maximum 100 records per page (recommended: 50)
5. **Populate Impact:** Setting `populate=true` increases response size and time

---

## 🧪 Testing

Run the comprehensive test script:
```bash
node scripts/testMasterAPI.js
```

This tests:
- ✅ Last 7, 15, 30 days filtering
- ✅ State, district, market filtering
- ✅ Commodity filtering
- ✅ Price range filtering
- ✅ Sorting and pagination
- ✅ Statistics endpoint
- ✅ Filter options endpoint
- ✅ Location hierarchy endpoints

---

## 📞 Support

For issues or questions:
1. Check filter options: `/api/v1/market-prices/filters`
2. Verify data exists for date range
3. Check spelling of filter values
4. Use case-insensitive search
5. Review pagination settings
