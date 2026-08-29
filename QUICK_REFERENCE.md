# APMC Khetivadi - Quick Command Reference

## 🚀 Server Commands

```bash
# Start server (production)
npm start

# Start server (development with auto-reload)
npm run dev
```

## 📊 Data Sync Commands

### Sync Yesterday's Data
```bash
# Using API endpoint (server must be running)
curl -X POST http://localhost:5000/api/v1/sync/yesterday

# Example response: Syncs data for yesterday's date automatically
```

### Sync Specific Date
```bash
# Using API endpoint (server must be running)
curl -X POST http://localhost:5000/api/v1/sync/date \
  -H "Content-Type: application/json" \
  -d '{"date": "10-02-2026", "state": "Gujarat"}'
```

### Sync Last 30 Days (Script)
```bash
# Default: 30 days
node scripts/syncLast30Days.js

# Or using npm
npm run sync:30days

# Last 7 days
node scripts/syncLast30Days.js 7
npm run sync:7days

# Custom days (1-365)
node scripts/syncLast30Days.js 15
```

## 📈 Database Status

```bash
# Get sync status and statistics
curl http://localhost:5000/api/v1/sync/status

# Response includes:
# - Total states, districts, markets, commodities, varieties, grades
# - Total price records
# - Latest data date
```

## 🧪 Testing Commands

```bash
# Test models creation
npm run test:models
# or
node scripts/testModels.js

# Test Data.gov.in API functions
npm run test:api
# or
node scripts/testApi.js

# Test sync API endpoints (server must be running)
npm run test:sync
# or
node scripts/testSync.js

# Test commodity analytics API (server must be running)
node scripts/testCommodityAnalyticsAPI.js

# Test comparison API (server must be running)
node scripts/testCompareAPI.js

# Initialize all collections
npm run init:collections
# or
node scripts/initCollections.js
```

## 📦 MongoDB Commands

```bash
# Connect to MongoDB shell
mongosh

# Use APMC database
use APMC

# Show all collections
show collections

# Count documents in each collection
db.states.countDocuments()
db.districts.countDocuments()
db.markets.countDocuments()
db.commodities.countDocuments()
db.varieties.countDocuments()
db.grades.countDocuments()
db.marketprices.countDocuments()

# View sample data
db.marketprices.find().limit(5).pretty()

# Find latest records
db.marketprices.find().sort({arrival_date: -1}).limit(10).pretty()

# Drop all data (DANGER!)
db.dropDatabase()
```

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## 📋 Common Workflows

### Initial Setup (First Time)
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Edit .env file with your settings

# 3. Start MongoDB
mongod

# 4. Initialize collections
npm run init:collections

# 5. Sync last 7 days of data (test)
node scripts/syncLast30Days.js 7

# 6. Check status
curl http://localhost:5000/api/v1/sync/status

# 7. If successful, sync more data
node scripts/syncLast30Days.js 30
```

### Daily Operations
```bash
# 1. Start server
npm run dev

# 2. Sync yesterday's data (automated)
curl -X POST http://localhost:5000/api/v1/sync/yesterday

# 3. Check status
curl http://localhost:5000/api/v1/sync/status
```

### Data Backfill
```bash
# Sync large historical data
node scripts/syncLast30Days.js 90

# Or in chunks
node scripts/syncLast30Days.js 30  # First 30 days
node scripts/syncLast30Days.js 30  # Next 30 days (updates existing, adds new)
```

## 🌐 API Endpoints

### Base URL
```
http://localhost:5000
```

### Health Check
```bash
GET  /                    # API info
GET  /health             # Health check
```

### Sync Endpoints
```bash
POST /api/v1/sync/yesterday     # Sync yesterday's data
POST /api/v1/sync/date          # Sync specific date
GET  /api/v1/sync/status        # Get statistics
```

### Analytics Endpoints
```bash
# Market-wide analytics
GET  /api/v1/analytics/market/:marketId
# Returns: price hikes, drops, new commodities, trends, etc.

# Commodity-specific analytics with price history
GET  /api/v1/analytics/market/:marketId/commodity/:commodityId?days=7|15|30
# Returns: price history for charts, statistics, trends, moving averages

# Compare commodity prices across two markets
GET  /api/v1/analytics/compare?commodityId={id}&marketIdA={id}&marketIdB={id}&days=7|15|30
# Returns: price comparison, trends, recommendations for both markets

# Get all markets list
GET  /api/v1/analytics/markets?state=Gujarat&district=Rajkot
# Returns: list of markets for selection
```

### Master Data Endpoints
```bash
GET  /api/v1/master/states          # All states
GET  /api/v1/master/districts       # All districts
GET  /api/v1/master/markets         # All markets
GET  /api/v1/master/commodities     # All commodities
```

## 🔑 Environment Variables

Located in `.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/APMC
DB_NAME=APMC

# Data.gov.in API
DATA_GOV_API_KEY=your_api_key_here
DATA_GOV_BASE_URL=https://api.data.gov.in/resource

# JWT (future)
JWT_SECRET=your_secret_here
API_VERSION=v1
```

## 📊 Quick Statistics Check

```bash
# One-liner to get all stats
curl -s http://localhost:5000/api/v1/sync/status | json_pp

# Or using PowerShell
(Invoke-RestMethod http://localhost:5000/api/v1/sync/status) | ConvertTo-Json -Depth 10
```

## 🛑 Troubleshooting

### Port Already in Use
```bash
# Kill node processes
# Windows (PowerShell)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Linux/Mac
killall node
```

### MongoDB Not Running
```bash
# Start MongoDB
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Clear All Data and Start Fresh
```bash
# 1. Connect to MongoDB
mongosh

# 2. Drop database
use APMC
db.dropDatabase()
exit

# 3. Re-initialize
npm run init:collections

# 4. Sync fresh data
node scripts/syncLast30Days.js 30
```

## 📱 Postman Collection

Import these endpoints into Postman:

```json
{
  "info": { "name": "APMC API" },
  "item": [
    {
      "name": "Sync Yesterday",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/v1/sync/yesterday"
      }
    },
    {
      "name": "Sync Specific Date",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/v1/sync/date",
        "body": {
          "mode": "raw",
          "raw": "{\"date\": \"10-02-2026\", \"state\": \"Gujarat\"}"
        }
      }
    },
    {
      "name": "Get Status",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/v1/sync/status"
      }
    }
  ]
}
```

## 🎯 Pro Tips

1. **Test First:** Always test with small data (1-3 days) before large syncs
2. **Monitor Logs:** Watch console output during sync
3. **Check Stats:** Verify data with `/sync/status` endpoint
4. **Safe Re-runs:** All sync operations are idempotent (safe to repeat)
5. **Backup Data:** Regular MongoDB backups recommended
6. **Weekend Syncs:** Run large syncs during off-peak hours

## 📚 Documentation Files

- `README.md` - Project overview
- `API_USAGE_GUIDE.md` - Data.gov.in API functions
- `SYNC_API_GUIDE.md` - Sync API endpoints
- `LAST_30_DAYS_SYNC_GUIDE.md` - Historical data sync
- `ANALYTICS_FEATURE_SUMMARY.md` - Analytics features overview
- `ANALYTICS_API_GUIDE.md` - Market analytics API guide
- `COMMODITY_ANALYTICS_API_GUIDE.md` - Commodity-specific analytics API
- `COMPARE_API_GUIDE.md` - Market comparison API for commodities
- `MASTER_API_GUIDE.md` - Master data API endpoints
- `QUICK_REFERENCE.md` - This file
