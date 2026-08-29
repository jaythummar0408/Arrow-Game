# Market Analytics API Documentation

## 🎯 Overview

The Analytics API provides comprehensive market insights by comparing **live data** from Data.gov.in API with **historical data** stored in the database. This enables real-time price tracking, trend analysis, and commodity monitoring for specific markets.

## 🔑 Key Features

- **Live vs Historical Comparison** - Compare today's prices with past 30 days
- **Price Movement Tracking** - Identify price hikes and drops
- **New Commodity Detection** - Track newly added commodities
- **Missing Data Alerts** - Identify commodities not updated today
- **Price Extremes** - Find highest and lowest priced commodities
- **Comprehensive Statistics** - Summary metrics for decision making

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api/v1/analytics
```

---

## 1️⃣ Get Markets List

**Endpoint:** `GET /api/v1/analytics/markets`

Get all available markets with their state and district information. Use this to get market IDs for analytics.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | string | No | Filter by state name |
| `district` | string | No | Filter by district name |

### Example Requests

```bash
# Get all markets
curl "http://localhost:5000/api/v1/analytics/markets"

# Get markets in Gujarat
curl "http://localhost:5000/api/v1/analytics/markets?state=Gujarat"

# Get markets in Ahmedabad district
curl "http://localhost:5000/api/v1/analytics/markets?district=Ahmedabad"
```

### Response Format

```json
{
  "success": true,
  "count": 167,
  "markets": [
    {
      "id": "698c6c4a5dc8d42d60acc036",
      "name": "APMC HALVAD",
      "district": "Morbi",
      "state": "Gujarat"
    },
    {
      "id": "698c69a7912eab34fd69a8e0",
      "name": "Morbi APMC",
      "district": "Morbi",
      "state": "Gujarat"
    }
  ]
}
```

---

## 2️⃣ Get Market Analytics

**Endpoint:** `GET /api/v1/analytics/market/:marketId`

Get comprehensive analytics for a specific market comparing live data with historical data.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `marketId` | ObjectId | Yes | MongoDB ObjectId of the market |

### Example Request

```bash
curl "http://localhost:5000/api/v1/analytics/market/698c6c4a5dc8d42d60acc036"
```

### Response Format

```json
{
  "success": true,
  "market": {
    "marketId": "698c6c4a5dc8d42d60acc036",
    "marketName": "APMC HALVAD",
    "district": "Morbi",
    "state": "Gujarat"
  },
  "date": "12-02-2026",
  "analytics": {
    "priceHikes": [
      {
        "commodity": "Wheat",
        "variety": "Lokvan",
        "grade": "FAQ",
        "currentPrice": 2800,
        "lastPrice": 2500,
        "lastPriceDate": "2026-02-11T00:00:00.000Z",
        "priceDifference": 300,
        "priceChangePercent": 12.0,
        "historicalCount": 15
      }
    ],
    "priceDrops": [
      {
        "commodity": "Cotton",
        "variety": "Local",
        "grade": "FAQ",
        "currentPrice": 7000,
        "lastPrice": 7525,
        "lastPriceDate": "2026-02-11T00:00:00.000Z",
        "priceDifference": -525,
        "priceChangePercent": -6.98,
        "historicalCount": 20
      }
    ],
    "newCommodities": [
      {
        "commodity": "Mango",
        "variety": "Keshar",
        "grade": "FAQ",
        "currentPrice": 12000,
        "minPrice": 11000,
        "maxPrice": 13000,
        "message": "New commodity added today"
      }
    ],
    "unchangedPrices": [
      {
        "commodity": "Onion",
        "variety": "Local",
        "grade": "Medium",
        "currentPrice": 3500,
        "lastPrice": 3500,
        "lastPriceDate": "2026-02-11T00:00:00.000Z",
        "priceDifference": 0,
        "priceChangePercent": 0,
        "historicalCount": 10
      }
    ],
    "notUpdatedToday": [
      {
        "commodity": "Groundnut",
        "variety": "Seed",
        "grade": "FAQ",
        "lastPrice": 7875,
        "lastPriceDate": "2026-02-11T00:00:00.000Z",
        "entriesCount": 12,
        "previousPrice": 8000,
        "previousPriceDate": "2026-02-10T00:00:00.000Z",
        "lastPriceChange": -125,
        "lastPriceChangePercent": -1.56,
        "lastTrend": "down"
      }
    ],
    "singleEntries": [
      {
        "commodity": "Tomato",
        "variety": "Local",
        "grade": "Medium",
        "currentPrice": 2500,
        "lastPrice": 2800,
        "lastPriceDate": "2026-02-10T00:00:00.000Z",
        "priceDifference": -300,
        "priceChangePercent": -10.71,
        "trend": "down"
      }
    ],
    "highestPrice": {
      "commodity": "Soyabean",
      "variety": "Yellow",
      "grade": "FAQ",
      "modalPrice": 15000,
      "minPrice": 14800,
      "maxPrice": 15200
    },
    "lowestPrice": {
      "commodity": "Wheat",
      "variety": "Local",
      "grade": "FAQ",
      "modalPrice": 2100,
      "minPrice": 2000,
      "maxPrice": 2200
    },
    "summary": {
      "totalLiveRecords": 85,
      "totalHistoricalRecords": 225,
      "uniqueCommodities": 42,
      "commoditiesUpdatedToday": 25,
      "commoditiesNotUpdatedToday": 17,
      "newCommoditiesAddedToday": 2
    }
  }
}
```

---

## 📊 Analytics Response Breakdown

### 1. **priceHikes** Array
Commodities with **increased prices** compared to last recorded price.

**Use Cases:**
- Identify trending commodities
- Alert users about price increases
- Track market demand

**Sorted By:** Price change percentage (highest first)

### 2. **priceDrops** Array
Commodities with **decreased prices** compared to last recorded price.

**Use Cases:**
- Find bargain opportunities
- Track supply increases
- Monitor market corrections

**Sorted By:** Price change percentage (most negative first)

### 3. **newCommodities** Array
Commodities that appear in today's data but **not in historical database**.

**Use Cases:**
- Track new market additions
- Monitor seasonal commodities
- Identify expanding markets

### 4. **unchangedPrices** Array
Commodities with **same price** as last recorded.

**Use Cases:**
- Identify stable commodities
- Track price consistency
- Plan long-term purchases

### 5. **notUpdatedToday** Array
Commodities in database but **not present in today's live data**.

**Use Cases:**
- Detect missing data
- Track commodity availability
- Monitor supply disruptions

**Includes:**
- Last known price and date
- Previous price for trend analysis
- Last price change percentage

### 6. **singleEntries** Array
Commodities with **only one historical entry**.

**Use Cases:**
- Track recently added items
- Monitor new commodity performance
- Insufficient data warning

### 7. **highestPrice** & **lowestPrice** Objects
Today's **most expensive** and **cheapest** commodities.

**Use Cases:**
- Market overview
- Price range analysis
- Quick decision making

### 8. **summary** Object
**Aggregate statistics** for overview.

**Metrics:**
- `totalLiveRecords` - Records fetched from API today
- `totalHistoricalRecords` - Records in database (last 30 days)
- `uniqueCommodities` - Total unique commodity-variety-grade combinations
- `commoditiesUpdatedToday` - Commodities present in today's data
- `commoditiesNotUpdatedToday` - Commodities missing from today's data
- `newCommoditiesAddedToday` - New commodities detected

---

## 🎯 Use Cases

### Use Case 1: Daily Market Dashboard
```javascript
// Get analytics for main market
const analytics = await axios.get(`/api/v1/analytics/market/${marketId}`);

// Display key metrics
dashboard.totalCommodities = analytics.data.analytics.summary.uniqueCommodities;
dashboard.priceHikes = analytics.data.analytics.priceHikes.length;
dashboard.priceDrops = analytics.data.analytics.priceDrops.length;
dashboard.newItems = analytics.data.analytics.newCommodities.length;
```

### Use Case 2: Price Alert System
```javascript
// Get market analytics
const analytics = await axios.get(`/api/v1/analytics/market/${marketId}`);

// Alert for significant price hikes (>10%)
const significantHikes = analytics.data.analytics.priceHikes.filter(
  item => item.priceChangePercent > 10
);

significantHikes.forEach(item => {
  sendAlert(`${item.commodity} price increased by ${item.priceChangePercent}%`);
});
```

### Use Case 3: Commodity Availability Check
```javascript
// Check if specific commodity is available today
const analytics = await axios.get(`/api/v1/analytics/market/${marketId}`);

const isAvailable = analytics.data.analytics.priceHikes.some(
  item => item.commodity === 'Wheat'
) || analytics.data.analytics.unchangedPrices.some(
  item => item.commodity === 'Wheat'
);

const isUnavailable = analytics.data.analytics.notUpdatedToday.some(
  item => item.commodity === 'Wheat'
);
```

### Use Case 4: Market Comparison
```javascript
// Compare multiple markets
const market1 = await axios.get(`/api/v1/analytics/market/${marketId1}`);
const market2 = await axios.get(`/api/v1/analytics/market/${marketId2}`);

// Compare highest prices
console.log(`Market 1 Highest: ${market1.data.analytics.highestPrice.modalPrice}`);
console.log(`Market 2 Highest: ${market2.data.analytics.highestPrice.modalPrice}`);
```

---

## 🔧 Frontend Integration

### React Example

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const MarketAnalytics = ({ marketId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(
          `/api/v1/analytics/market/${marketId}`
        );
        setAnalytics(response.data.analytics);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [marketId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="analytics-dashboard">
      <h2>{analytics.market.marketName} Analytics</h2>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Commodities</h3>
          <p>{analytics.summary.uniqueCommodities}</p>
        </div>
        <div className="card">
          <h3>Updated Today</h3>
          <p>{analytics.summary.commoditiesUpdatedToday}</p>
        </div>
        <div className="card green">
          <h3>Price Hikes</h3>
          <p>{analytics.priceHikes.length}</p>
        </div>
        <div className="card red">
          <h3>Price Drops</h3>
          <p>{analytics.priceDrops.length}</p>
        </div>
      </div>

      {/* Price Hikes */}
      <div className="price-hikes">
        <h3>Top Price Hikes</h3>
        {analytics.priceHikes.slice(0, 5).map((item, index) => (
          <div key={index} className="price-item">
            <span>{item.commodity} ({item.variety})</span>
            <span className="price-change green">
              +{item.priceChangePercent}%
            </span>
            <span>₹{item.lastPrice} → ₹{item.currentPrice}</span>
          </div>
        ))}
      </div>

      {/* Price Drops */}
      <div className="price-drops">
        <h3>Top Price Drops</h3>
        {analytics.priceDrops.slice(0, 5).map((item, index) => (
          <div key={index} className="price-item">
            <span>{item.commodity} ({item.variety})</span>
            <span className="price-change red">
              {item.priceChangePercent}%
            </span>
            <span>₹{item.lastPrice} → ₹{item.currentPrice}</span>
          </div>
        ))}
      </div>

      {/* New Commodities */}
      {analytics.newCommodities.length > 0 && (
        <div className="new-commodities">
          <h3>New Arrivals Today</h3>
          {analytics.newCommodities.map((item, index) => (
            <div key={index} className="new-item">
              <span>{item.commodity} ({item.variety})</span>
              <span>₹{item.currentPrice}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketAnalytics;
```

---

## 📈 Performance Notes

### Data Sources
1. **Live Data** - Fetched from Data.gov.in API in real-time
2. **Historical Data** - Retrieved from MongoDB (last 30 days)

### Response Time
- **Markets List:** ~50-100ms
- **Market Analytics:** ~1-3 seconds (includes external API call)

### Optimization Tips
1. **Cache market list** - Markets don't change frequently
2. **Periodic refresh** - Fetch analytics every 30 minutes
3. **Background updates** - Use worker threads for frequent updates
4. **Pagination** - For large result arrays

---

## ⚠️ Error Handling

### Common Errors

#### 404 - Market Not Found
```json
{
  "success": false,
  "message": "Market not found",
  "marketId": "invalid_id"
}
```

**Solution:** Verify market ID exists using `/analytics/markets`

#### 500 - API Fetch Failed
```json
{
  "success": false,
  "message": "Failed to fetch live market data",
  "error": "API connection error"
}
```

**Solution:** Check Data.gov.in API availability and API key

---

## 🧪 Testing

Run the analytics test script:
```bash
node scripts/testAnalyticsAPI.js
```

This tests:
- ✅ Markets list retrieval
- ✅ Market analytics generation
- ✅ State filtering
- ✅ District filtering
- ✅ Data comparison logic

---

## 📚 Related Documentation

- [Master API Guide](MASTER_API_GUIDE.md) - Query historical data
- [Sync API Guide](SYNC_API_GUIDE.md) - Sync historical data
- [Postman Guide](POSTMAN_GUIDE.md) - Testing with Postman
- [Routes README](routes/README.md) - All API routes

---

## 🎓 Best Practices

1. **Get Market ID First** - Always fetch markets list before analytics
2. **Handle Empty Data** - Check if arrays are empty before rendering
3. **Cache Results** - Don't fetch analytics too frequently
4. **Error Boundaries** - Wrap API calls in try-catch
5. **Loading States** - Show loading indicator during fetch

---

**Last Updated:** February 12, 2026  
**Version:** 1.0.0
