# Data.gov.in API Integration Guide

## 📚 Available Functions

### 1. **fetchHistoricalPrices** - Get Past Commodity Prices

Fetch historical commodity price data from the Data.gov.in API.

**Usage:**
```javascript
const { fetchHistoricalPrices } = require('./utils/dataGovApi');

const result = await fetchHistoricalPrices({
  state: 'Gujarat',          // Required
  district: 'Junagarh',      // Optional
  market: '',                // Optional
  commodity: 'Soyabean',     // Optional
  variety: '',               // Optional
  grade: ''                  // Optional
}, 2000); // limit (default: 2000)

// Response
{
  success: true,
  data: { records: [...] },
  count: 2
}
```

### 2. **fetchDailyPrices** - Get Daily Commodity Prices

Fetch commodity prices for a specific date.

**Usage:**
```javascript
const { fetchDailyPrices } = require('./utils/dataGovApi');

const result = await fetchDailyPrices({
  state: 'Gujarat',
  district: 'Amreli',
  commodity: 'Soyabean',
  arrivalDate: '10-02-2026'  // Format: DD-MM-YYYY
}, 3000); // limit (default: 3000)

// Response
{
  success: true,
  data: { 
    records: [
      {
        State: 'Gujarat',
        District: 'Amreli',
        Market: 'Amreli APMC',
        Commodity: 'Soyabean',
        Variety: 'Soyabeen',
        Grade: 'FAQ',
        Arrival_Date: '10/02/2026',
        Min_Price: 4875,
        Max_Price: 5175,
        Modal_Price: 5125,
        Commodity_Code: 13
      }
    ]
  },
  count: 3
}
```

### 3. **fetchTodayPrices** - Get Today's Prices

Convenience function to get today's commodity prices.

**Usage:**
```javascript
const { fetchTodayPrices } = require('./utils/dataGovApi');

const result = await fetchTodayPrices({
  state: 'Gujarat',
  district: 'Amreli',
  commodity: 'Soyabean'
});
```

### 4. **getTodayDate** - Get Current Date

Get today's date in DD-MM-YYYY format.

**Usage:**
```javascript
const { getTodayDate } = require('./utils/dataGovApi');

const today = getTodayDate(); // Returns: '11-02-2026'
```

---

## 🎯 Practical Examples

### Example 1: In a Controller

```javascript
// controllers/priceController.js
const { fetchDailyPrices } = require('../utils/dataGovApi');

exports.getDailyPrices = async (req, res) => {
  try {
    const { state, district, commodity, date } = req.query;
    
    const result = await fetchDailyPrices({
      state,
      district,
      commodity,
      arrivalDate: date
    });

    if (result.success) {
      res.json({
        success: true,
        count: result.count,
        data: result.data.records
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### Example 2: Scheduled Data Sync

```javascript
// utils/syncData.js
const { fetchTodayPrices } = require('./dataGovApi');
const { MarketPrice } = require('../models');

const syncTodayPrices = async () => {
  const states = ['Gujarat', 'Maharashtra', 'Rajasthan'];
  
  for (const state of states) {
    const result = await fetchTodayPrices({
      state,
      district: '', // All districts
      commodity: '' // All commodities
    });

    if (result.success) {
      // Process and save to database
      console.log(`Synced ${result.count} records for ${state}`);
    }
  }
};
```

### Example 3: Multiple Queries

```javascript
const { fetchHistoricalPrices } = require('./utils/dataGovApi');

// Fetch prices for multiple commodities
const commodities = ['Soyabean', 'Wheat', 'Rice'];

const results = await Promise.all(
  commodities.map(commodity => 
    fetchHistoricalPrices({
      state: 'Gujarat',
      commodity
    })
  )
);

results.forEach((result, index) => {
  console.log(`${commodities[index]}: ${result.count} records`);
});
```

---

## 📝 Response Format

### Historical Prices Response:
```javascript
{
  state: 'Gujarat',
  district: 'Junagarh',
  market: 'Visavadar APMC',
  commodity: 'Soyabean',
  variety: 'Black',
  grade: 'FAQ',
  arrival_date: '11/02/2026',
  min_price: 4365,
  max_price: 4925,
  modal_price: 4645
}
```

### Daily Prices Response:
```javascript
{
  State: 'Gujarat',
  District: 'Amreli',
  Market: 'Amreli APMC',
  Commodity: 'Soyabean',
  Variety: 'Soyabeen',
  Grade: 'FAQ',
  Arrival_Date: '10/02/2026',
  Min_Price: 4875,
  Max_Price: 5175,
  Modal_Price: 5125,
  Commodity_Code: 13
}
```

---

## ⚠️ Important Notes

1. **Date Format**: Use `DD-MM-YYYY` format for `arrivalDate`
2. **Case Sensitivity**: 
   - Historical API: lowercase keys (`state`, `district`)
   - Daily API: Capitalized keys (`State`, `District`)
3. **Limit**: Maximum 3000 records per request
4. **Empty Filters**: Pass empty string `''` for optional filters
5. **Error Handling**: Always check `result.success` before using data

---

## 🔧 Test Script

Run the test script to verify API functionality:

```bash
node testApi.js
```

This will test all three main functions and display sample results.
