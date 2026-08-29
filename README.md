# APMC Khetivadi Backend

Comprehensive Node.js backend for APMC market commodity price data management with Data.gov.in API integration.

## 🎯 Project Overview

Real-time commodity market price tracking system for Agricultural Produce Market Committee (APMC) markets across India. Currently supporting Gujarat with **21,940+ price records** covering **119 commodities** across **160+ markets**.

### ✨ Key Features
- ✅ **Real-time Data Sync** from Data.gov.in APIs
- ✅ **Normalized Database** with 7 relational models
- ✅ **Comprehensive Query API** with 15+ filters
- ✅ **Advanced Filtering** by location, commodity, variety, grade, price range
- ✅ **Flexible Date Ranges** (7/15/30 days or custom)
- ✅ **Statistics & Aggregations** for data analysis
- ✅ **Pagination & Sorting** for optimal performance
- ✅ **Historical Data Backfill** with sequential processing

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher) ✅ Currently using v24.12.0
- MongoDB (local or cloud) ✅ Local instance on port 27017
- npm or yarn ✅
- Data.gov.in API Key 🔑

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 24.12.0 | Backend runtime |
| **Express** | 4.18.2 | Web framework |
| **MongoDB** | Latest | Database |
| **Mongoose** | 8.0.3 | ODM |
| **Axios** | 1.13.5 | HTTP client |
| **dotenv** | 16.3.1 | Environment vars |
| **CORS** | 2.8.5 | Cross-origin support |

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values as needed

3. Make sure MongoDB is running locally on port 27017

### Running the Application

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
APMC_khetivadi/
├── config/
│   ├── database.js      # MongoDB connection
│   └── config.js        # App configuration
├── models/              # Mongoose models
├── routes/              # API routes
├── controllers/         # Route controllers
├── middleware/          # Custom middleware
├── utils/               # Helper functions
├── scripts/             # Utility and test scripts
│   ├── testModels.js    # Test models
│   ├── testApi.js       # Test API functions
│   ├── testSync.js      # Test sync endpoints
│   ├── initCollections.js  # Initialize DB collections
│   └── syncLast30Days.js   # Sync historical data
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── server.js            # Main application file
└── package.json         # Dependencies and scripts
```

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Server port | 5000 | No |
| NODE_ENV | Environment | development | No |
| MONGO_URI | MongoDB connection | mongodb://localhost:27017/APMC | Yes |
| DB_NAME | Database name | APMC | Yes (fixed) |
| DATA_GOV_API_KEY | Data.gov.in API key | - | Yes |
| DATA_GOV_BASE_URL | Data.gov.in base URL | - | Yes |
| JWT_SECRET | JWT secret key | - | No |
| API_VERSION | API version | v1 | No |

**Get API Key:** Register at [data.gov.in](https://data.gov.in/) to obtain your API key.

## ⚡ Quick Start

### 1. Clone and Install
```bash
cd APMC_khetivadi
npm install
```

### 2. Configure Environment
```bash
# Copy template
copy .env.example .env

# Edit .env file - add your API key
DATA_GOV_API_KEY=your_api_key_here
MONGO_URI=mongodb://localhost:27017/APMC
```

### 3. Start MongoDB
```bash
# Make sure MongoDB is running on port 27017
```

### 4. Start Server
```bash
npm run dev
# Server starts on http://localhost:5000
```

### 5. Sync Data (First Time)
```bash
# Sync yesterday's data
curl -X POST http://localhost:5000/api/v1/sync/yesterday

# OR sync last 30 days
npm run sync:30days
```

### 6. Query Data
```bash
# Get last 7 days prices
curl "http://localhost:5000/api/v1/market-prices?days=7&limit=10"

# Get statistics
curl "http://localhost:5000/api/v1/market-prices/stats?days=30"
```

## 📊 Sample API Usage

### Get Last 7 Days Data for Gujarat
```bash
curl "http://localhost:5000/api/v1/market-prices?days=7&state=Gujarat&limit=10&populate=true"
```

### Get Wheat Prices Sorted by Price
```bash
curl "http://localhost:5000/api/v1/market-prices?days=15&commodity=Wheat&sortBy=modal_price&sortOrder=desc"
```

### Get Statistics
```bash
curl "http://localhost:5000/api/v1/market-prices/stats?days=30"
```

### Get Filter Options (for dropdowns)
```bash
curl "http://localhost:5000/api/v1/market-prices/filters"
```

See **[MASTER_API_GUIDE.md](MASTER_API_GUIDE.md)** for complete API documentation with 15+ query parameters.

## 📡 API Endpoints

### Health Check
- `GET /` - API welcome message
- `GET /health` - Health check endpoint

### Sync API (`/api/v1/sync`)
- `POST /api/v1/sync/yesterday` - Sync yesterday's data
- `POST /api/v1/sync/date` - Sync specific date data
- `GET /api/v1/sync/status` - Get database status

### Master Market Prices API (`/api/v1/market-prices`)
- `GET /api/v1/market-prices` - **Main query endpoint** (15+ filters)
  - Query params: `days`, `startDate`, `endDate`, `state`, `district`, `market`
  - `commodity`, `commodityCode`, `variety`, `grade`
  - `minPrice`, `maxPrice`, `sortBy`, `sortOrder`, `page`, `limit`, `populate`
- `GET /api/v1/market-prices/stats` - Get statistics & aggregations
- `GET /api/v1/market-prices/filters` - Get all filter options
- `GET /api/v1/market-prices/districts/:state` - Get districts by state
- `GET /api/v1/market-prices/markets/:district` - Get markets by district

### Analytics API (`/api/v1/analytics`)
- `GET /api/v1/analytics/markets` - Get all markets with state/district info
- `GET /api/v1/analytics/market/:marketId` - **Market analytics** (Live vs Historical)
  - Price hikes & drops, new commodities, missing data, highest/lowest prices

📖 **Detailed API Documentation:**
- [Sync API Guide](SYNC_API_GUIDE.md)
- [Master API Guide](MASTER_API_GUIDE.md) - Comprehensive query API docs
- [Analytics API Guide](ANALYTICS_API_GUIDE.md) - Market analytics & insights
- [Data.gov.in API Usage](API_USAGE_GUIDE.md)

## 🗄️ Database

- **Database Name:** APMC
- **Connection:** MongoDB (Local/Atlas)
- **ODM:** Mongoose

### Database Schema (7 Models)

```
State (1)
  └── District (30)
        └── Market (160+)
              └── MarketPrice (21,940+)
                    ├── Commodity (119)
                    ├── Variety (185)
                    └── Grade (11)
```

### Models Overview
| Model | Description | Records |
|-------|-------------|---------|
| State | State master | 1 |
| District | District with state ref | 30 |
| Market | Market with district ref | 160+ |
| Commodity | Commodity with unique code | 119 |
| Variety | Variety master | 185 |
| Grade | Grade master | 11 |
| MarketPrice | Price data with all refs | 21,940+ |

## 🛠️ Utility Scripts

All scripts are in the `scripts/` folder. Run from project root:

```bash
# Test model creation
npm run test:models
# or
node scripts/testModels.js

# Test Data.gov.in API functions
npm run test:api
# or
node scripts/testApi.js

# Test sync API endpoints
npm run test:sync
# or
node scripts/testSync.js

# Test master query API
node scripts/testMasterAPI.js

# Test analytics API
npm run test:analytics
# or
node scripts/testAnalyticsAPI.js

# Initialize database collections (optional)
npm run init:collections
# or
node scripts/initCollections.js

# Sync last 30 days historical data
npm run sync:30days
# or
node scripts/syncLast30Days.js

# Sync last 7 days
npm run sync:7days
```

📖 **Scripts Documentation:** [scripts/README.md](scripts/README.md)

## 📚 Complete Documentation

- **[README.md](README.md)** - This file (project overview)
- **[MASTER_API_GUIDE.md](MASTER_API_GUIDE.md)** - ⭐ Comprehensive query API documentation
- **[ANALYTICS_API_GUIDE.md](ANALYTICS_API_GUIDE.md)** - ⭐ Market analytics & insights
- **[SYNC_API_GUIDE.md](SYNC_API_GUIDE.md)** - Data synchronization endpoints
- **[API_USAGE_GUIDE.md](API_USAGE_GUIDE.md)** - Data.gov.in API integration
- **[LAST_30_DAYS_SYNC_GUIDE.md](LAST_30_DAYS_SYNC_GUIDE.md)** - Historical data sync
- **[POSTMAN_GUIDE.md](POSTMAN_GUIDE.md)** - Postman collection usage
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Command cheat sheet
- **[scripts/README.md](scripts/README.md)** - Scripts documentation

## 📝 License

ISC

## 🎉 Project Status

### ✅ Completed Features
- [x] MongoDB connection and configuration
- [x] 7 normalized database models with relationships
- [x] Data.gov.in API integration (2 endpoints)
- [x] Smart entity management with duplicate handling
- [x] Sync API for daily and historical data
- [x] Sequential 30-day historical data backfill
- [x] Master query API with 15+ filters
- [x] Statistics and aggregations endpoint
- [x] Hierarchical location queries
- [x] Pagination and sorting
- [x] Comprehensive documentation (6 docs)
- [x] Testing scripts for all features

### 🚧 Pending Features
- [ ] Multi-state support (currently Gujarat only)
- [ ] Authentication & authorization
- [ ] Automated daily sync scheduling (cron jobs)
- [ ] Rate limiting
- [ ] API key management
- [ ] User management
- [ ] Frontend integration
- [ ] Data export features (CSV, Excel)
- [ ] Advanced analytics endpoints
- [ ] Real-time notifications

## 💡 Key Highlights

- **21,940+ Price Records** - Last 30 days of market data
- **119 Commodities** - Wide range of agricultural products
- **160+ Markets** - Comprehensive market coverage
- **185 Varieties** - Detailed product classifications
- **11 Grades** - Quality categorization
- **Advanced Filtering** - 15+ query parameters for precise data retrieval
- **Performance Optimized** - With indexes, pagination, and smart caching
- **Production Ready** - Error handling, validation, and logging

## 📞 Support & Contact

For questions or issues:
1. Check the [documentation files](.)
2. Review [MASTER_API_GUIDE.md](MASTER_API_GUIDE.md) for API usage
3. Run test scripts to verify setup
4. Check sync status: `GET /api/v1/sync/status`

---

**Built with ❤️ for APMC Khetivadi Project**
