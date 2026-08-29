# Commodity Analytics API Guide

## Overview
The Commodity Analytics API provides detailed price analytics for a specific commodity in a specific market, perfect for displaying price charts and trend analysis on the frontend.

---

## API Endpoint

### Get Commodity Analytics
**GET** `/api/v1/analytics/market/:marketId/commodity/:commodityId`

Get detailed analytics for a specific commodity in a market with historical price data.

#### URL Parameters
- `marketId` (required) - MongoDB ObjectId of the market
- `commodityId` (required) - MongoDB ObjectId of the commodity

#### Query Parameters
- `days` (optional) - Time period for analytics
  - Allowed values: `7`, `15`, `30`
  - Default: `30`
  - Example: `?days=7` for last 7 days

#### Example Requests
```
GET /api/v1/analytics/market/507f1f77bcf86cd799439011/commodity/507f191e810c19729de860ea
GET /api/v1/analytics/market/507f1f77bcf86cd799439011/commodity/507f191e810c19729de860ea?days=7
GET /api/v1/analytics/market/507f1f77bcf86cd799439011/commodity/507f191e810c19729de860ea?days=15
```

---

## Response Structure

### Success Response (200 OK)

```json
{
  "success": true,
  "market": {
    "marketId": "507f1f77bcf86cd799439011",
    "marketName": "Rajkot",
    "marketName_gj": "રાજકોટ",
    "district": "Rajkot",
    "district_gj": "રાજકોટ",
    "state": "Gujarat",
    "state_gj": "ગુજરાત"
  },
  "commodity": {
    "commodityId": "507f191e810c19729de860ea",
    "commodityName": "Wheat",
    "commodityName_gj": "ઘઉં",
    "commodityCode": "0201"
  },
  "period": {
    "days": 30,
    "from": "2026-01-14",
    "to": "2026-02-13"
  },
  "analytics": {
    "isUpdatedToday": true,
    "todayPrice": {
      "date": "2026-02-13",
      "modalPrice": 2500,
      "minPrice": 2400,
      "maxPrice": 2600,
      "arrivalDate": "2026-02-13"
    },
    "latestPrices": [],
    "priceHistory": [
      {
        "date": "2026-02-13T00:00:00.000Z",
        "modalPrice": 2500,
        "minPrice": 2400,
        "maxPrice": 2600
      },
      {
        "date": "2026-02-12T00:00:00.000Z",
        "modalPrice": 2450,
        "minPrice": 2350,
        "maxPrice": 2550
      }
      // ... more historical data
    ],
    "statistics": {
      "totalRecords": 25,
      "period": "30 days",
      "modalPrice": {
        "highest": 2600,
        "lowest": 2200,
        "average": "2425.50",
        "current": 2500
      },
      "minPrice": {
        "highest": 2500,
        "lowest": 2100,
        "average": "2325.50"
      },
      "maxPrice": {
        "highest": 2700,
        "lowest": 2300,
        "average": "2525.50"
      }
    },
    "trends": {
      "recentTrend": {
        "change": 50,
        "changePercent": 2.04,
        "direction": "up",
        "comparison": "vs previous day"
      },
      "overallTrend": {
        "change": 300,
        "changePercent": 13.64,
        "direction": "up",
        "comparison": "vs 30 days ago"
      },
      "volatility": {
        "priceRange": 400,
        "priceRangePercent": "18.18"
      },
      "priceMovement": {
        "increases": 15,
        "decreases": 8,
        "stable": 1,
        "totalComparisons": 24
      }
    }
  }
}
```

### When Commodity Not Updated Today

If the commodity hasn't been updated today, the response includes the latest 3 historical prices:

```json
{
  "analytics": {
    "isUpdatedToday": false,
    "todayPrice": null,
    "latestPrices": [
      {
        "date": "2026-02-10T00:00:00.000Z",
        "modalPrice": 2450,
        "minPrice": 2350,
        "maxPrice": 2550,
        "variety": "Lokwan",
        "variety_gj": "લોકવણ",
        "grade": "FAQ",
        "grade_gj": "FAQ"
      },
      {
        "date": "2026-02-08T00:00:00.000Z",
        "modalPrice": 2400,
        "minPrice": 2300,
        "maxPrice": 2500,
        "variety": "Lokwan",
        "variety_gj": "લોકવણ",
        "grade": "FAQ",
        "grade_gj": "FAQ"
      },
      {
        "date": "2026-02-05T00:00:00.000Z",
        "modalPrice": 2380,
        "minPrice": 2280,
        "maxPrice": 2480,
        "variety": "Lokwan",
        "variety_gj": "લોકવણ",
        "grade": "FAQ",
        "grade_gj": "FAQ"
      }
    ],
    "priceHistory": [
      // ... historical data
    ],
    "statistics": { /* ... */ },
    "trends": { /* ... */ }
  }
}
```

---

## Response Fields Explained

### Market Information
- `market` - Complete market details with English and Gujarati names
- `commodity` - Commodity details with code and bilingual names

### Period Information
- `period.days` - Number of days analyzed
- `period.from` - Start date of analysis period
- `period.to` - End date (today)

### Analytics Object

#### `isUpdatedToday` (boolean)
- `true` - Commodity price was updated today
- `false` - No update today, showing historical data

#### `todayPrice` (object or null)
Present only when `isUpdatedToday` is `true`
- `date` - Today's date
- `modalPrice` - Today's modal/average price
- `minPrice` - Today's minimum price
- `maxPrice` - Today's maximum price

#### `latestPrices` (array)
Present when `isUpdatedToday` is `false`
- Array of last 3 price records from database
- Includes variety and grade information
- Useful for showing "last known prices"

#### `priceHistory` (array)
Complete price history for the selected period (7/15/30 days)
- Ordered from newest to oldest
- Each entry contains: date, modalPrice, minPrice, maxPrice
- **Use this for charts and graphs**

#### `statistics` (object)
Price statistics for the period:
- `totalRecords` - Number of price records found
- `period` - Period description
- `modalPrice.highest` - Highest modal price in period
- `modalPrice.lowest` - Lowest modal price in period
- `modalPrice.average` - Average modal price
- `modalPrice.current` - Current/latest price
- Similar stats for `minPrice` and `maxPrice`

#### `trends` (object)
Trend analysis:

**`recentTrend`** - Day-over-day comparison
- `change` - Price difference from previous day
- `changePercent` - Percentage change
- `direction` - `"up"`, `"down"`, or `"stable"`

**`overallTrend`** - Period-wide comparison
- `change` - Price difference from start to end of period
- `changePercent` - Overall percentage change
- `direction` - Overall trend direction

**`volatility`** - Price stability metrics
- `priceRange` - Difference between highest and lowest
- `priceRangePercent` - Range as percentage

**`priceMovement`** - Pattern analysis
- `increases` - Number of days price went up
- `decreases` - Number of days price went down
- `stable` - Number of days price remained same
- `totalComparisons` - Total day-to-day comparisons

---

## Error Responses

### 404 Not Found - Market
```json
{
  "success": false,
  "message": "Market not found",
  "marketId": "507f1f77bcf86cd799439011"
}
```

### 404 Not Found - Commodity
```json
{
  "success": false,
  "message": "Commodity not found",
  "commodityId": "507f191e810c19729de860ea"
}
```

### 400 Bad Request - Invalid Days
```json
{
  "success": false,
  "message": "Invalid days parameter. Allowed values: 7, 15, 30"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to generate commodity analytics",
  "error": "Error details..."
}
```

---

## Frontend Integration Examples

### 1. Display Price Chart

```javascript
const response = await fetch(
  `/api/v1/analytics/market/${marketId}/commodity/${commodityId}?days=30`
);
const data = await response.json();

// Use priceHistory for chart
const chartData = data.analytics.priceHistory.map(item => ({
  date: new Date(item.date).toLocaleDateString(),
  price: item.modalPrice,
  min: item.minPrice,
  max: item.maxPrice
}));

// Display with Chart.js, Recharts, or any charting library
```

### 2. Show Current Price vs History

```javascript
if (data.analytics.isUpdatedToday) {
  // Show today's price
  const current = data.analytics.todayPrice;
  console.log(`Today: ₹${current.modalPrice}`);
} else {
  // Show latest 3 prices
  const latest = data.analytics.latestPrices;
  console.log('Latest prices:', latest);
}
```

### 3. Display Trend Indicators

```javascript
const trend = data.analytics.trends.recentTrend;
const trendIcon = trend.direction === 'up' ? '📈' : 
                  trend.direction === 'down' ? '📉' : '➡️';

console.log(`${trendIcon} ${trend.changePercent}% ${trend.comparison}`);
```

### 4. Show Statistics Summary

```javascript
const stats = data.analytics.statistics;
console.log(`
  Average: ₹${stats.modalPrice.average}
  Highest: ₹${stats.modalPrice.highest}
  Lowest: ₹${stats.modalPrice.lowest}
  Current: ₹${stats.modalPrice.current}
`);
```

### 5. Time Period Selector

```javascript
// Let user choose time period
const periods = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 15 Days', value: 15 },
  { label: 'Last 30 Days', value: 30 }
];

// Fetch data based on selection
const fetchData = async (days) => {
  const response = await fetch(
    `/api/v1/analytics/market/${marketId}/commodity/${commodityId}?days=${days}`
  );
  return await response.json();
};
```

---

## Use Cases

### 1. **Price History Chart**
Use `priceHistory` array to display line charts showing price trends over time.

### 2. **Trend Indicators**
Use `trends` object to show up/down arrows and percentage changes.

### 3. **Price Comparison**
Compare today's price with historical averages and extremes.

### 4. **Market Insights**
Show volatility, price movements, and stability metrics.

### 5. **Latest Price Display**
When commodity isn't updated today, show the last 3 known prices.

### 6. **Time-based Analysis**
Allow users to switch between 7, 15, and 30-day views.

---

## Testing the API

### Using cURL

```bash
# Test with default 30 days
curl http://localhost:3000/api/v1/analytics/market/507f1f77bcf86cd799439011/commodity/507f191e810c19729de860ea

# Test with 7 days
curl "http://localhost:3000/api/v1/analytics/market/507f1f77bcf86cd799439011/commodity/507f191e810c19729de860ea?days=7"

# Test with 15 days
curl "http://localhost:3000/api/v1/analytics/market/507f1f77bcf86cd799439011/commodity/507f191e810c19729de860ea?days=15"
```

### Using JavaScript/Fetch

```javascript
async function getCommodityAnalytics(marketId, commodityId, days = 30) {
  try {
    const response = await fetch(
      `/api/v1/analytics/market/${marketId}/commodity/${commodityId}?days=${days}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

// Usage
const analytics = await getCommodityAnalytics(
  '507f1f77bcf86cd799439011',
  '507f191e810c19729de860ea',
  7
);
```

---

## Best Practices

1. **Cache Results**: Cache API responses for a few minutes to reduce server load
2. **Period Selection**: Default to 30 days, allow users to filter to 7 or 15 days
3. **Handle Empty Data**: Check if `priceHistory` is empty and show appropriate message
4. **Loading States**: Show loading indicators while fetching data
5. **Error Handling**: Gracefully handle 404 errors for invalid IDs
6. **Responsive Charts**: Ensure price charts work well on mobile devices
7. **Date Formatting**: Format dates according to user's locale
8. **Price Formatting**: Display prices with proper currency symbols (₹)

---

## Notes

- The API checks live data from Data.gov.in API first for today's prices
- If not updated today, it fetches from historical database records
- Price history is sorted by date (newest first)
- All statistics are calculated from available data in the selected period
- Trend analysis requires at least 2 data points
- Volatility indicates price stability (lower is more stable)
- Price movement shows overall market behavior pattern

---

## Related APIs

- **Market Analytics API**: `/api/v1/analytics/market/:marketId` - Get all commodities analytics for a market
- **Markets List API**: `/api/v1/analytics/markets` - Get list of all markets
- **Master Data API**: `/api/v1/master/*` - Get states, districts, markets, commodities

---

## Support

For issues or questions, please check the main README.md or other API guide documents.
