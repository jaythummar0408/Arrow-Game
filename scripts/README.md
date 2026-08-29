# Scripts Directory

This folder contains all utility and testing scripts for the APMC Khetivadi project.

## 📁 Available Scripts

### Testing Scripts

#### `testModels.js`
Tests all MongoDB models and database connection.
```bash
npm run test:models
# or
node scripts/testModels.js
```

#### `testApi.js`
Tests Data.gov.in API functions (fetchHistoricalPrices, fetchDailyPrices, etc.).
```bash
npm run test:api
# or
node scripts/testApi.js
```

#### `testSync.js`
Tests sync API endpoints (requires server to be running).
```bash
npm run test:sync
# or
node scripts/testSync.js
```

### Initialization Scripts

#### `initCollections.js`
Creates all MongoDB collections in the database.
```bash
npm run init:collections
# or
node scripts/initCollections.js
```

### Data Sync Scripts

#### `syncLast30Days.js`
Syncs historical data for the last N days from Data.gov.in.
```bash
# Sync last 30 days
npm run sync:30days
# or
node scripts/syncLast30Days.js 30

# Sync last 7 days
npm run sync:7days
# or
node scripts/syncLast30Days.js 7

# Custom days (1-365)
node scripts/syncLast30Days.js 90
```

## 🚀 Quick Start

### First Time Setup
```bash
# 1. Test models
npm run test:models

# 2. Initialize collections
npm run init:collections

# 3. Test API functions
npm run test:api

# 4. Sync sample data (3 days)
node scripts/syncLast30Days.js 3

# 5. Start server
npm run dev

# 6. Test sync endpoints
npm run test:sync
```

## 📊 Common Workflows

### Daily Testing
```bash
npm run test:models    # Test database models
npm run test:api       # Test external API
npm run test:sync      # Test sync endpoints
```

### Data Management
```bash
# Initialize fresh database
npm run init:collections

# Sync historical data
node scripts/syncLast30Days.js 30

# Check status
curl http://localhost:5000/api/v1/sync/status
```

## 📝 Notes

- All scripts use relative paths (`../`) to access project files
- Scripts are located in the `scripts/` folder for better organization
- npm scripts are available in `package.json` for convenience
- Server must be running for `testSync.js` to work
- MongoDB must be running for all database scripts
