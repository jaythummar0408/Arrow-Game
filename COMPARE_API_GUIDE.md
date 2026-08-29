# Commodity Price Comparison API Guide

## Overview
The Commodity Price Comparison API allows you to compare prices of a specific commodity across two different markets. This is useful for farmers and traders to identify the best market for buying or selling commodities.

## API Endpoint

```
GET /api/v1/analytics/compare
```

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| commodityId | String (MongoDB ObjectId) | Yes | - | The commodity to compare |
| marketIdA | String (MongoDB ObjectId) | Yes | - | First market for comparison |
| marketIdB | String (MongoDB ObjectId) | Yes | - | Second market for comparison |
| days | Number | No | 7 | Time period for comparison (7, 15, or 30) |

## How It Works

### Data Collection Logic

1. **Live Data Check**: First checks today's prices from Data.gov.in API
2. **Historical Data**: Fetches price history from database for the specified period
3. **Fallback**: If no data in the period, looks for any historical data
4. **Bilingual Support**: Returns names in both English and Gujarati

### For Each Market:
- Current price (today's if available, otherwise most recent)
- Min, max, and average prices for the period
- Price trend (up/down/stable)
- Percentage change
- Complete price history
- Last updated timestamp

## Response Structure

```json
{
  "success": true,
  "commodity": {
    "commodityId": "64a1b2c3d4e5f6a7b8c9d0e1",
    "commodityName": "Groundnut",
    "commodityName_gj": "મગફળી",
    "commodityCode": "0034"
  },
  "period": {
    "days": 7,
    "from": "2026-02-06",
    "to": "2026-02-13"
  },
  "comparison": {
    "marketA": {
      "marketId": "64a1b2c3d4e5f6a7b8c9d0e2",
      "marketName": "Rajkot",
      "marketName_gj": "રાજકોટ",
      "district": "Rajkot",
      "district_gj": "રાજકોટ",
      "state": "Gujarat",
      "state_gj": "ગુજરાત",
      "currentPrice": 9500,
      "minPrice": 8800,
      "maxPrice": 10200,
      "avgPrice": 9400,
      "trend": "up",
      "changePercent": 2.5,
      "lastUpdated": "2026-02-13T00:00:00.000Z",
      "priceHistory": [
        {
          "date": "2026-02-13T00:00:00.000Z",
          "modalPrice": 9500,
          "minPrice": 9100,
          "maxPrice": 10200
        },
        {
          "date": "2026-02-12T00:00:00.000Z",
          "modalPrice": 9450,
          "minPrice": 9050,
          "maxPrice": 9850
        }
        // ... more records
      ]
    },
    "marketB": {
      "marketId": "64a1b2c3d4e5f6a7b8c9d0e3",
      "marketName": "Gondal",
      "marketName_gj": "ગોંડલ",
      "district": "Rajkot",
      "district_gj": "રાજકોટ",
      "state": "Gujarat",
      "state_gj": "ગુજરાત",
      "currentPrice": 9200,
      "minPrice": 8600,
      "maxPrice": 9800,
      "avgPrice": 9100,
      "trend": "down",
      "changePercent": -1.3,
      "lastUpdated": "2026-02-13T00:00:00.000Z",
      "priceHistory": [
        {
          "date": "2026-02-13T00:00:00.000Z",
          "modalPrice": 9200,
          "minPrice": 8800,
          "maxPrice": 9800
        }
        // ... more records
      ]
    },
    "priceDifference": 300,
    "priceDifferencePercent": 3.26,
    "cheaperMarket": "marketB",
    "recommendation": "Gondal is ₹300 cheaper (3.26% less). Gondal has consistently better prices on average."
  }
}
```

## Example Requests

### 1. Basic Comparison (7 days)
```bash
curl "http://localhost:5000/api/v1/analytics/compare?commodityId=64a1b2c3d4e5f6a7b8c9d0e1&marketIdA=64a1b2c3d4e5f6a7b8c9d0e2&marketIdB=64a1b2c3d4e5f6a7b8c9d0e3&days=7"
```

### 2. Extended Comparison (30 days)
```bash
curl "http://localhost:5000/api/v1/analytics/compare?commodityId=64a1b2c3d4e5f6a7b8c9d0e1&marketIdA=64a1b2c3d4e5f6a7b8c9d0e2&marketIdB=64a1b2c3d4e5f6a7b8c9d0e3&days=30"
```

### 3. Using JavaScript/Axios
```javascript
const axios = require('axios');

async function comparePrices(commodityId, marketIdA, marketIdB, days = 7) {
  try {
    const response = await axios.get('http://localhost:5000/api/v1/analytics/compare', {
      params: {
        commodityId,
        marketIdA,
        marketIdB,
        days
      }
    });
    
    const { comparison } = response.data;
    
    console.log(`Market A (${comparison.marketA.marketName}): ₹${comparison.marketA.currentPrice}`);
    console.log(`Market B (${comparison.marketB.marketName}): ₹${comparison.marketB.currentPrice}`);
    console.log(`Recommendation: ${comparison.recommendation}`);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Usage
comparePrices(
  '64a1b2c3d4e5f6a7b8c9d0e1',
  '64a1b2c3d4e5f6a7b8c9d0e2',
  '64a1b2c3d4e5f6a7b8c9d0e3',
  7
);
```

## Error Responses

### 400 - Missing Parameters
```json
{
  "success": false,
  "message": "Missing required parameters: commodityId, marketIdA, marketIdB"
}
```

### 400 - Invalid Days Parameter
```json
{
  "success": false,
  "message": "Invalid days parameter. Allowed values: 7, 15, 30"
}
```

### 404 - Commodity Not Found
```json
{
  "success": false,
  "message": "Commodity not found",
  "commodityId": "64a1b2c3d4e5f6a7b8c9d0e1"
}
```

### 404 - Market Not Found
```json
{
  "success": false,
  "message": "Market A not found",
  "marketIdA": "64a1b2c3d4e5f6a7b8c9d0e2"
}
```

## Frontend Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

function CommodityComparison() {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    try {
      const response = await axios.get('/api/v1/analytics/compare', {
        params: {
          commodityId: '64a1b2c3d4e5f6a7b8c9d0e1',
          marketIdA: '64a1b2c3d4e5f6a7b8c9d0e2',
          marketIdB: '64a1b2c3d4e5f6a7b8c9d0e3',
          days: 7
        }
      });
      setComparison(response.data);
    } catch (error) {
      console.error('Error fetching comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!comparison) return <div>No data available</div>;

  const { marketA, marketB } = comparison.comparison;

  // Prepare chart data
  const chartData = {
    labels: marketA.priceHistory.map(p => 
      new Date(p.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: marketA.marketName,
        data: marketA.priceHistory.map(p => p.modalPrice),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: marketB.marketName,
        data: marketB.priceHistory.map(p => p.modalPrice),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="commodity-comparison">
      <h2>Commodity Comparison</h2>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="market-card">
          <h3>{marketA.marketName}</h3>
          <p className="price">₹{marketA.currentPrice}</p>
          <p className={`trend ${marketA.trend}`}>
            {marketA.trend === 'up' ? '📈' : marketA.trend === 'down' ? '📉' : '➡️'}
            {marketA.changePercent}%
          </p>
          <p>Avg: ₹{marketA.avgPrice}</p>
        </div>
        
        <div className="market-card">
          <h3>{marketB.marketName}</h3>
          <p className="price">₹{marketB.currentPrice}</p>
          <p className={`trend ${marketB.trend}`}>
            {marketB.trend === 'up' ? '📈' : marketB.trend === 'down' ? '📉' : '➡️'}
            {marketB.changePercent}%
          </p>
          <p>Avg: ₹{marketB.avgPrice}</p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="recommendation-banner">
        <strong>💡 {comparison.comparison.recommendation}</strong>
      </div>

      {/* Price Comparison Chart */}
      <div className="chart-container">
        <h3>Price Comparison Chart</h3>
        <Line data={chartData} options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: `${comparison.commodity.commodityName} Price Comparison`
            }
          }
        }} />
      </div>

      {/* Detailed Statistics */}
      <div className="detailed-stats">
        <h3>Detailed Statistics</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>{marketA.marketName}</th>
              <th>{marketB.marketName}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Current Price</td>
              <td>₹{marketA.currentPrice}</td>
              <td>₹{marketB.currentPrice}</td>
            </tr>
            <tr>
              <td>Min Price</td>
              <td>₹{marketA.minPrice}</td>
              <td>₹{marketB.minPrice}</td>
            </tr>
            <tr>
              <td>Max Price</td>
              <td>₹{marketA.maxPrice}</td>
              <td>₹{marketB.maxPrice}</td>
            </tr>
            <tr>
              <td>Average Price</td>
              <td>₹{marketA.avgPrice}</td>
              <td>₹{marketB.avgPrice}</td>
            </tr>
            <tr>
              <td>Trend</td>
              <td>{marketA.trend} ({marketA.changePercent}%)</td>
              <td>{marketB.trend} ({marketB.changePercent}%)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CommodityComparison;
```

### Vue.js Component Example

```vue
<template>
  <div class="commodity-comparison">
    <h2>{{ commodity.commodityName }} ({{ commodity.commodityName_gj }})</h2>
    
    <div class="markets-comparison">
      <!-- Market A Card -->
      <div class="market-card">
        <h3>{{ marketA.marketName }}</h3>
        <div class="price">₹{{ marketA.currentPrice }}</div>
        <div :class="['trend', marketA.trend]">
          {{ getTrendIcon(marketA.trend) }} {{ marketA.changePercent }}%
        </div>
        <div class="stats">
          <span>Min: ₹{{ marketA.minPrice }}</span>
          <span>Max: ₹{{ marketA.maxPrice }}</span>
          <span>Avg: ₹{{ marketA.avgPrice }}</span>
        </div>
      </div>
      
      <!-- Market B Card -->
      <div class="market-card">
        <h3>{{ marketB.marketName }}</h3>
        <div class="price">₹{{ marketB.currentPrice }}</div>
        <div :class="['trend', marketB.trend]">
          {{ getTrendIcon(marketB.trend) }} {{ marketB.changePercent }}%
        </div>
        <div class="stats">
          <span>Min: ₹{{ marketB.minPrice }}</span>
          <span>Max: ₹{{ marketB.maxPrice }}</span>
          <span>Avg: ₹{{ marketB.avgPrice }}</span>
        </div>
      </div>
    </div>
    
    <div class="recommendation">
      {{ recommendation }}
    </div>
    
    <div class="price-chart">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Chart from 'chart.js/auto';

export default {
  name: 'CommodityComparison',
  data() {
    return {
      commodity: {},
      marketA: {},
      marketB: {},
      recommendation: '',
      chart: null
    };
  },
  mounted() {
    this.fetchComparison();
  },
  methods: {
    async fetchComparison() {
      try {
        const response = await axios.get('/api/v1/analytics/compare', {
          params: {
            commodityId: this.$route.query.commodityId,
            marketIdA: this.$route.query.marketIdA,
            marketIdB: this.$route.query.marketIdB,
            days: 7
          }
        });
        
        const data = response.data;
        this.commodity = data.commodity;
        this.marketA = data.comparison.marketA;
        this.marketB = data.comparison.marketB;
        this.recommendation = data.comparison.recommendation;
        
        this.createChart();
      } catch (error) {
        console.error('Error:', error);
      }
    },
    
    createChart() {
      const ctx = this.$refs.chartCanvas.getContext('2d');
      
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.marketA.priceHistory.map(p => 
            new Date(p.date).toLocaleDateString()
          ),
          datasets: [
            {
              label: this.marketA.marketName,
              data: this.marketA.priceHistory.map(p => p.modalPrice),
              borderColor: 'rgb(75, 192, 192)'
            },
            {
              label: this.marketB.marketName,
              data: this.marketB.priceHistory.map(p => p.modalPrice),
              borderColor: 'rgb(255, 99, 132)'
            }
          ]
        }
      });
    },
    
    getTrendIcon(trend) {
      return trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
    }
  }
};
</script>
```

## Use Cases

### 1. For Farmers
- **Selling Decision**: Compare prices in nearby markets to find the best selling price
- **Transport Cost Analysis**: Factor in distance vs price difference
- **Trend Analysis**: See which market has better price trends

### 2. For Traders
- **Arbitrage Opportunities**: Identify price differences for profitable trading
- **Market Intelligence**: Understand price patterns across markets
- **Risk Assessment**: Evaluate price volatility in different markets

### 3. For Government/Regulators
- **Market Monitoring**: Track price disparities across regions
- **Policy Making**: Identify markets needing intervention
- **Data Analysis**: Historical comparison for planning

## Testing

Run the test script:
```bash
node scripts/testCompareAPI.js
```

The test script will:
1. Fetch available markets
2. Get commodities from a market
3. Compare prices across two markets
4. Test different time periods (7, 15, 30 days)
5. Validate error handling

## Best Practices

1. **Cache Results**: Cache comparison results for frequently requested pairs
2. **Limit Requests**: Add rate limiting for production use
3. **User Experience**: Show loading states during API calls
4. **Error Handling**: Display user-friendly error messages
5. **Date Formatting**: Format dates according to user locale
6. **Price Display**: Use proper currency formatting
7. **Mobile Optimization**: Make charts responsive for mobile devices

## Performance Considerations

- Default period is 7 days for faster responses
- Use 15 or 30 days when more historical context is needed
- Consider implementing pagination for very large datasets
- Add caching layer for frequently compared market pairs

## Future Enhancements

- [ ] Compare more than 2 markets simultaneously
- [ ] Add distance/transportation cost factor
- [ ] Historical comparison (same period last year)
- [ ] Export comparison data to Excel/PDF
- [ ] Email alerts when price difference exceeds threshold
- [ ] Integration with Google Maps for route planning
