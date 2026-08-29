# 📊 Data Flow Architecture & Optimization Strategy

## 📌 Executive Summary

**Problem:** 75% of API response time is consumed by real-time data fetching and combining with DB data.  
**Root Cause:** Live API call to Government site happens on every user request.  
**Solution:** Hourly caching of today's data with smart commodity_code backfilling strategy.

---

## 🔄 CURRENT ARCHITECTURE

### 1. Data Sources

#### **Source A: Historical API (Past Days Data)**
- **Endpoint:** `9ef84268-d588-465a-a308-a864a43d0070`
- **Contains:** Complete data including `commodity_code`
- **Used For:** Past days data (yesterday and before)
- **Schedule:** Nightly sync at midnight
- **Fields:** State, District, Market, Commodity, Variety, Grade, Min_Price, Max_Price, Modal_Price, Arrival_Date, **commodity_code**

#### **Source B: Daily API (Today's Data)** 
- **Endpoint:** `35985678-0d79-46b4-9ed6-6f13308a1d24`
- **Contains:** Today's live data **WITHOUT** `commodity_code`
- **Used For:** Real-time today's prices
- **Schedule:** Called on every user request
- **Fields:** State, District, Market, Commodity, Variety, Grade, Min_Price, Max_Price, Modal_Price, Arrival_Date

### 2. Current Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CURRENT FLOW                              │
└─────────────────────────────────────────────────────────────────┘

NIGHTLY SYNC (12:00 AM)
┌──────────────────────┐
│  Historical API      │  (Yesterday's data with commodity_code)
│  (Source A)          │
└──────────┬───────────┘
           │
           ▼
   ┌───────────────┐
   │  dataProcessor │  ← Process and normalize
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │   MongoDB     │
   │  Collections  │
   │               │
   │ • States      │
   │ • Districts   │
   │ • Markets     │
   │ • Commodities │  ✅ commodity_code stored
   │ • Varieties   │
   │ • Grades      │
   │ • MarketPrice │
   └───────────────┘


USER REQUEST (Any time during the day)
┌─────────────────────┐
│  User API Request   │
│  /analytics/market/ │
│    /market-prices   │
└──────────┬──────────┘
           │
           ▼
   ┌───────────────────┐
   │  Analytics        │
   │  Controller       │
   └───────┬───────────┘
           │
           │ ⏱️ STEP 1: Fetch Today's Live Data (SLOW - 70-75% time)
           │
           ├──────────────────────────┐
           │                          │
           ▼                          ▼
   ┌────────────────┐        ┌─────────────┐
   │  Daily API     │        │  MongoDB    │
   │  (Source B)    │        │  (DB Data)  │
   │                │        │             │
   │  Live data     │        │  Past 30    │
   │  for TODAY     │        │  days data  │
   │                │        │             │
   │  ❌ NO         │        │  ✅ Has     │
   │  commodity_code│        │  commodity_ │
   │                │        │  code       │
   └────────┬───────┘        └──────┬──────┘
           │                        │
           │ ⏱️ STEP 2: Combine & Process (10-15% time)
           │                        │
           └────────────┬───────────┘
                        │
                        ▼
                ┌───────────────┐
                │  Merged Data  │
                │  Response     │
                └───────────────┘
                        │
                        ▼
                ┌───────────────┐
                │   User Gets   │
                │   Response    │
                └───────────────┘
```

### 3. Performance Bottleneck Analysis

**Total Response Time Breakdown:**
```
┌─────────────────────────────────────────────────┐
│ Fetch Live Data (Gov API)      │ 70-75%    ███ │
│ Process & Combine               │ 10-15%    █   │
│ DB Query (Historical)           │ 8-10%     █   │
│ Response Formatting             │ 2-5%      ▌   │
└─────────────────────────────────────────────────┘
```

**Why is Live API Call Slow?**
1. **External API dependency** - Network latency + Government server response time
2. **Large dataset** - Fetching 1000-3000 records per call
3. **No caching** - Same data fetched repeatedly for concurrent users
4. **Synchronous blocking** - User waits for external API response

---

## 🚀 PROPOSED OPTIMIZED ARCHITECTURE

### Strategy: Hourly Today's Data Caching with Smart Backfilling

### 1. New Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     OPTIMIZED FLOW                               │
└─────────────────────────────────────────────────────────────────┘

HOURLY SYNC (Every Hour: 12:00 AM, 1:00 AM, 2:00 AM... 11:00 PM)
┌──────────────────────┐
│  Daily API           │  (Today's data WITHOUT commodity_code)
│  (Source B)          │
└──────────┬───────────┘
           │
           ▼
   ┌───────────────────┐
   │  dataProcessor    │
   │                   │
   │  1. Create State/ │
   │     District/     │
   │     Market        │
   │                   │
   │  2. Find/Create   │  ← Match by commodity NAME only
   │     Commodity     │    If found: Use existing _id & commodity_code
   │     (by name)     │    If new: Create with commodity_code = null
   │                   │
   │  3. Save to DB    │
   │     with arrival  │
   │     _date = TODAY │
   └───────┬───────────┘
           │
           ▼
   ┌───────────────┐
   │   MongoDB     │
   │  Collections  │
   │               │
   │ MarketPrice   │
   │  {            │
   │   commodity:  │  ← Has _id (ObjectId)
   │   arrival_    │
   │    date:      │  ← TODAY's date
   │    2026-02-19 │
   │   modal_price │
   │   ...         │
   │  }            │
   └───────────────┘


NIGHTLY SYNC (12:00 AM) 
┌──────────────────────┐
│  Historical API      │  (Yesterday's data WITH commodity_code)
│  (Source A)          │
└──────────┬───────────┘
           │
           ▼
   ┌───────────────────────┐
   │  dataProcessor        │
   │                       │
   │  1. Normal processing │
   │     (as before)       │
   │                       │
   │  2. BACKFILL          │  ← NEW STEP
   │     commodity_code    │
   │                       │
   │     For each record:  │
   │     - Get commodity   │
   │       by name         │
   │     - Update          │
   │       commodity_code  │
   │       in Commodities  │
   │       collection      │
   └───────┬───────────────┘
           │
           ▼
   ┌────────────────────┐
   │   MongoDB          │
   │                    │
   │  Commodities       │
   │  {                 │
   │   name: "Wheat"    │
   │   commodity_code:  │  ← Updated from yesterday's data
   │       110          │
   │   ...              │
   │  }                 │
   └────────────────────┘


USER REQUEST (Any time during the day)
┌─────────────────────┐
│  User API Request   │
│  /analytics/market/ │
│    /market-prices   │
└──────────┬──────────┘
           │
           │ ⚡ FAST - No external API call!
           │
           ▼
   ┌───────────────────┐
   │  Analytics        │
   │  Controller       │
   └───────┬───────────┘
           │
           │ Query MongoDB ONLY
           │
           ▼
   ┌─────────────────────────┐
   │      MongoDB            │
   │                         │
   │  Query: {               │
   │    arrival_date: {      │
   │      $gte: today,       │  ← Today's data (from hourly sync)
   │      $lte: 30 days ago  │  + Past data (from nightly sync)
   │    }                    │
   │  }                      │
   │                         │
   │  ✅ All data in one DB  │
   │  ✅ Uniform structure   │
   │  ✅ Fast query          │
   └────────┬────────────────┘
           │
           ▼
   ┌───────────────┐
   │  Process &    │
   │  Format       │
   │  Response     │
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │   User Gets   │
   │   Response    │
   │   ⚡ 80% FASTER│
   └───────────────┘
```

### 2. Performance Improvement

**Expected Response Time Reduction:**

```
BEFORE:
┌────────────────────────────────────────────┐
│ External API Call:    2000-3000 ms   ███████████████████ 75% │
│ DB Query:              300-400 ms    ███                  10% │
│ Processing:            200-300 ms    ██                    8% │
│ Response Format:       100-200 ms    █                     7% │
├────────────────────────────────────────────┤
│ TOTAL:              ~2600-3900 ms          │
└────────────────────────────────────────────┘

AFTER:
┌────────────────────────────────────────────┐
│ DB Query (All Data):   400-600 ms    ███████████████  65% │
│ Processing:            150-200 ms    ████            20% │
│ Response Format:       100-150 ms    ███             15% │
├────────────────────────────────────────────┤
│ TOTAL:                ~650-950 ms          │
│ IMPROVEMENT:          75-80% FASTER ⚡      │
└────────────────────────────────────────────┘
```

---

## 🎯 SOLUTION DETAILS

### Option 1: Two-Phase Sync Strategy (RECOMMENDED) ⭐

#### **Phase 1: Hourly Sync (Today's Data)**

**Purpose:** Keep today's data fresh in database

**When:** Every hour (0:00, 1:00, 2:00... 23:00)

**What:**
1. Call Daily API (Source B) with `arrival_date` = TODAY
2. For each record:
   - Create/update State, District, Market (as usual)
   - **Find existing Commodity by NAME** (not commodity_code)
     - If exists: Use existing commodity `_id` and its `commodity_code`
     - If new: Create new Commodity with `commodity_code = null`
   - Create/update MarketPrice record with `arrival_date` = TODAY

**Key Points:**
- ✅ Today's data stays in DB (fast access)
- ✅ Commodity linked by existing database records
- ✅ New commodities created without commodity_code (temporary)
- ✅ Runs every hour to keep data fresh

#### **Phase 2: Nightly Backfill (Commodity Code Update)**

**Purpose:** Fill missing commodity_codes from yesterday's complete data

**When:** 12:30 AM (after midnight, 30 mins after hourly sync)

**What:**
1. Call Historical API (Source A) with `arrival_date` = YESTERDAY
2. Process records normally (create MarketPrice for yesterday)
3. **Additional Backfill Step:**
   ```javascript
   For each record with commodity_code:
     - Find Commodity by name in DB
     - If commodity.commodity_code is null:
         Update commodity.commodity_code = record.Commodity_Code
   ```

**Key Points:**
- ✅ Fills missing commodity_codes within 24 hours
- ✅ No data loss
- ✅ Backward compatible with existing commodities
- ✅ Handles new commodities gracefully

---

### Data Consistency Handling

#### Scenario 1: Brand New Commodity
```
Time: 10:00 AM (Hourly Sync)
- Daily API returns "New Organic Wheat"
- Commodity doesn't exist
- Create: { name: "New Organic Wheat", commodity_code: null }
- MarketPrice created with reference to this commodity

Time: 12:30 AM Next Day (Nightly Sync)
- Historical API returns "New Organic Wheat" with commodity_code: 999
- Find commodity by name
- Update: { name: "New Organic Wheat", commodity_code: 999 }
- ✅ Backfilled successfully
```

#### Scenario 2: Existing Commodity
```
Time: 2:00 PM (Hourly Sync)
- Daily API returns "Wheat"
- Commodity already exists: { name: "Wheat", commodity_code: 110 }
- Use existing commodity reference
- ✅ commodity_code already present
```

#### Scenario 3: Commodity Name Change (Edge Case)
```
If government changes commodity name in daily API:
- Treated as new commodity
- Created with commodity_code: null
- Will be backfilled next night if name in historical API matches
- If name completely different: Remains as separate commodity
- 📝 Solution: Manual merge script (one-time cleanup)
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Hourly Sync Implementation

**Files to Create/Modify:**

1. **New Route:** `/api/v1/sync/hourly`
   ```javascript
   // routes/syncRoutes.js
   router.post('/hourly', syncController.syncHourlyData);
   ```

2. **New Controller Function:** `syncHourlyData`
   ```javascript
   // controllers/syncController.js
   exports.syncHourlyData = async (req, res) => {
     // Fetch today's data from Daily API
     // Process without requiring commodity_code
     // Save to MarketPrice with arrival_date = TODAY
   }
   ```

3. **Modify dataProcessor.js:**
   ```javascript
   // utils/dataProcessor.js
   const getOrCreateCommodity = async (commodityName, commodityCode = null) => {
     // Allow commodityCode to be optional
     // Match by name first, then by code
   }
   ```

4. **Cron Job Setup:**
   ```javascript
   // server.js or separate cron.js
   const cron = require('node-cron');
   
   // Run every hour
   cron.schedule('0 * * * *', async () => {
     await syncHourlyData();
   });
   ```

### Phase 2: Nightly Backfill Implementation

**Files to Modify:**

1. **Update syncYesterdayData Controller:**
   ```javascript
   // controllers/syncController.js
   exports.syncYesterdayData = async (req, res) => {
     // Existing logic
     // + New backfill logic
     await backfillCommodityCodes(records);
   }
   ```

2. **New Utility Function:**
   ```javascript
   // utils/dataProcessor.js
   const backfillCommodityCodes = async (records) => {
     for (const record of records) {
       if (record.Commodity_Code) {
         const commodity = await Commodity.findOne({ 
           name: record.Commodity 
         });
         if (commodity && !commodity.commodity_code) {
           commodity.commodity_code = record.Commodity_Code;
           await commodity.save();
         }
       }
     }
   }
   ```

3. **Update Cron Schedule:**
   ```javascript
   // Run at 12:30 AM (after hourly sync at 12:00 AM)
   cron.schedule('30 0 * * *', async () => {
     await syncYesterdayData();
   });
   ```

### Phase 3: Controller Updates

**Files to Modify:**

1. **analyticsController.js**
   ```javascript
   // REMOVE: fetchLiveMarketData() call
   // REPLACE WITH: Direct MongoDB query including today's date
   
   const todayData = await MarketPrice.find({
     market: marketId,
     arrival_date: {
       $gte: today,
       $lte: thirtyDaysAgo
     }
   });
   // Now includes today's data from hourly sync
   ```

2. **marketPriceController.js**
   ```javascript
   // Update date range to include TODAY
   query.arrival_date = {
     $gte: startDate,
     $lte: today  // Changed from: today - 1
   };
   ```

---

## 🔍 TESTING STRATEGY

### Unit Tests

```javascript
// tests/hourly-sync.test.js
describe('Hourly Sync', () => {
  it('should sync today data without commodity_code', async () => {
    // Test sync without commodity_code
  });
  
  it('should link to existing commodity by name', async () => {
    // Test commodity matching
  });
  
  it('should create new commodity with null code', async () => {
    // Test new commodity creation
  });
});

// tests/nightly-backfill.test.js
describe('Nightly Backfill', () => {
  it('should backfill missing commodity codes', async () => {
    // Test backfill logic
  });
  
  it('should not overwrite existing codes', async () => {
    // Test idempotency
  });
});
```

### Integration Tests

1. **Test Hourly Sync:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/sync/hourly
   ```

2. **Test Nightly Sync:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/sync/yesterday
   ```

3. **Test User API Response Time:**
   ```bash
   # Before optimization
   time curl http://localhost:5000/api/v1/analytics/market/[marketId]
   # Expected: 2-3 seconds
   
   # After optimization  
   time curl http://localhost:5000/api/v1/analytics/market/[marketId]
   # Expected: 500-800ms
   ```

---

## 🚨 EDGE CASES & HANDLING

### 1. Hourly Sync Fails
**Issue:** Hourly cron job fails (network error, API down)

**Solution:**
- ✅ Keep retry logic (3 attempts with exponential backoff)
- ✅ Log failures
- ✅ User API will still return data (might be 1 hour old)
- ✅ Next hourly sync will catch up

### 2. Commodity Code Never Arrives
**Issue:** New commodity in daily API but never appears in historical API

**Solution:**
- ✅ Commodity exists in DB with `commodity_code: null`
- ✅ Queries work fine (we query by commodity._id, not code)
- ✅ Eventually gets code when it appears in historical API
- ✅ Manual intervention possible via script if needed

### 3. Government API Changes Commodity Name
**Issue:** Same commodity, different name in daily vs historical

**Solution:**
- ✅ Treated as two separate commodities initially
- ✅ Create manual merge script: `scripts/mergeCommodities.js`
- ✅ Document known name variations
- ✅ Add name normalization function if pattern emerges

### 4. Clock Skew (Server Time vs Government Time)
**Issue:** Server thinks it's 11:59 PM, government thinks it's 12:01 AM

**Solution:**
- ✅ Use government API date field, not server time
- ✅ Query by `arrival_date` field (from API response)
- ✅ Time zone: Store all dates in UTC
- ✅ Handle overlapping dates gracefully (upsert logic)

---

## 📊 MONITORING & ALERTS

### Key Metrics to Track

1. **Hourly Sync Health:**
   - Success rate (target: >99%)
   - Average sync time (target: <60 seconds)
   - Records processed per hour
   - Commodities without commodity_code

2. **API Performance:**
   - Average response time (target: <800ms)
   - 95th percentile response time (target: <1200ms)
   - Cache hit rate for today's data

3. **Data Quality:**
   - Percentage of commodities with commodity_code
   - Daily new commodities count
   - Backfill success rate

### Suggested Logging

```javascript
// Hourly Sync Log
{
  timestamp: "2026-02-19T14:00:00Z",
  type: "hourly_sync",
  status: "success",
  records_fetched: 1247,
  records_created: 1247,
  records_updated: 0,
  new_commodities: 2,
  duration_ms: 4523,
  commodities_without_code: 5
}

// Nightly Sync Log
{
  timestamp: "2026-02-20T00:30:00Z",
  type: "nightly_sync",
  status: "success",
  records_fetched: 3421,
  records_created: 3421,
  backfill_attempted: 5,
  backfill_successful: 5,
  duration_ms: 12453
}
```

---

## 🎯 ROLLBACK PLAN

If optimization causes issues:

### Immediate Rollback (5 minutes)
```bash
# 1. Disable cron jobs
# Comment out in server.js

# 2. Revert controller changes
git checkout HEAD~1 -- controllers/analyticsController.js
git checkout HEAD~1 -- controllers/marketPriceController.js

# 3. Restart server
pm2 restart apmc-api

# System will revert to live API calls
```

### Gradual Rollback (Hybrid Approach)
```javascript
// Keep both approaches temporarily
// Add feature flag in config
const USE_CACHED_TODAY_DATA = process.env.USE_CACHED_TODAY_DATA === 'true';

if (USE_CACHED_TODAY_DATA) {
  // Use DB query
} else {
  // Use live API call (old method)
}
```

---

## 🎉 EXPECTED BENEFITS

### Performance
- ⚡ **75-80% faster** API response times
- 📉 Reduced from ~2.5s to ~600ms average
- 🚀 Better user experience
- 📊 Can handle 5-10x more concurrent users

### Reliability
- ✅ Less dependent on external API availability
- ✅ Consistent response times (no network variability)
- ✅ Data remains accessible even if gov API is down temporarily

### Scalability
- 📈 Reduced external API calls from N (per user) to 24 (per day)
- 💰 Lower infrastructure costs (fewer external calls)
- 🔄 Easy to add caching layer (Redis) if needed

### Data Quality
- ✅ All data in single source (MongoDB)
- ✅ Uniform structure and access patterns
- ✅ Easier to implement features (price alerts, analytics)
- ✅ Better data consistency

---

## 📚 NEXT STEPS

### Immediate (Week 1)
1. ✅ Review and approve this architecture
2. 📝 Create detailed implementation tasks
3. 🧪 Set up test environment
4. 👨‍💻 Implement hourly sync

### Short-term (Week 2-3)
5. 🔄 Implement nightly backfill
6. 🧪 Test both sync mechanisms
7. 📊 Update controllers to use cached data
8. ✅ Integration testing

### Long-term (Week 4+)
9. 🚀 Deploy to production with feature flag
10. 📈 Monitor performance metrics
11. 🔧 Fine-tune based on real data
12. 📚 Document final implementation

---

## 🤔 DECISION SUMMARY

### Why This Solution?

**Alternative 1: Cache Live API Response**
- ❌ Still needs initial slow call
- ❌ Cache invalidation complexity
- ❌ Doesn't solve commodity_code issue

**Alternative 2: Background Job Every 5 Minutes**
- ⚠️ Too frequent (288 API calls/day vs 24)
- ⚠️ Hitting rate limits risk
- ✅ Fresher data (5 min vs 1 hour)

**Alternative 3: On-demand with Queue**
- ❌ First user still waits
- ❌ Complex architecture
- ❌ Doesn't solve core problem

**✅ Selected Solution: Hourly + Nightly Sync**
- ✅ Optimal balance of freshness (1 hour) vs API load (24 calls)
- ✅ Solves 75% performance issue
- ✅ Handles commodity_code elegantly
- ✅ Simple architecture
- ✅ Easy to implement and maintain
- ✅ Backward compatible

---

## 📞 SUPPORT & QUESTIONS

For implementation questions or concerns about this architecture, please:

1. Review this document thoroughly
2. Check implementation checklist
3. Test in development environment first
4. Document any deviations from this plan

---

**Document Version:** 1.0  
**Last Updated:** February 19, 2026  
**Author:** GitHub Copilot  
**Status:** Ready for Implementation ✅
