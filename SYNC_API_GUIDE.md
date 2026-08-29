# Data Sync API Documentation

## 🎯 Overview

The Data Sync API automatically fetches commodity price data from Data.gov.in and stores it in your database. It intelligently handles all related entities (states, districts, markets, commodities, varieties, grades) and creates or updates price records.

## 📊 Test Results

**First Sync (10-02-2026) - Gujarat:**
- ✅ **884 records** successfully synced
- ✅ **1 state** created (Gujarat)
- ✅ **29 districts** created
- ✅ **124 markets** created
- ✅ **101 commodities** created
- ✅ **142 varieties** created
- ✅ **8 grades** created
- ✅ **884 price records** added

## 🚀 API Endpoints

### 1. Sync Yesterday's Data
Automatically syncs data for yesterday (current date - 1 day) for Gujarat state.

**Endpoint:** `POST /api/v1/sync/yesterday`

**Request:**
```bash
POST http://localhost:5000/api/v1/sync/yesterday
```

**Response:**
```json
{
  "success": true,
  "message": "Data synced successfully",
  "date": "10-02-2026",
  "state": "Gujarat",
  "summary": {
    "total": 884,
    "created": 884,
    "updated": 0,
    "errors": 0
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/v1/sync/yesterday
```

---

### 2. Sync Specific Date
Sync data for any specific date and state.

**Endpoint:** `POST /api/v1/sync/date`

**Request Body:**
```json
{
  "date": "10-02-2026",
  "state": "Gujarat"
}
```

**Request:**
```bash
POST http://localhost:5000/api/v1/sync/date
Content-Type: application/json

{
  "date": "10-02-2026",
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
  "summary": {
    "total": 884,
    "created": 884,
    "updated": 0,
    "errors": 0
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/v1/sync/date \
  -H "Content-Type: application/json" \
  -d '{"date": "10-02-2026", "state": "Gujarat"}'
```

---

### 3. Get Sync Status
Get current database statistics and latest synced date.

**Endpoint:** `GET /api/v1/sync/status`

**Request:**
```bash
GET http://localhost:5000/api/v1/sync/status
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "states": 1,
    "districts": 29,
    "markets": 124,
    "commodities": 101,
    "varieties": 142,
    "grades": 8,
    "priceRecords": 884
  },
  "latestDataDate": "2026-02-10T00:00:00.000Z"
}
```

**cURL:**
```bash
curl http://localhost:5000/api/v1/sync/status
```

---

## 🔧 How It Works

### Data Processing Flow:

1. **Fetch Data** from Data.gov.in API
2. **For Each Record:**
   - Check if **State** exists → Create if not
   - Check if **District** exists → Create if not  
   - Check if **Market** exists → Create if not
   - Check if **Commodity** exists (by code) → Create if not
   - Check if **Variety** exists → Create if not
   - Check if **Grade** exists → Create if not
   - Check if **Price Record** exists → Update if exists, Create if not

3. **Duplicate Prevention:**
   - Uses unique constraints to prevent duplicates
   - Handles race conditions gracefully
   - Updates existing records instead of creating duplicates

### Sample API Response Data:
```json
{
  "State": "Gujarat",
  "District": "Sabarkantha",
  "Market": "Dhansura APMC",
  "Commodity": "Arhar(Tur/Red Gram)(Whole)",
  "Variety": "Other",
  "Grade": "Local",
  "Arrival_Date": "10/02/2026",
  "Min_Price": 7000,
  "Max_Price": 7700,
  "Modal_Price": 7500,
  "Commodity_Code": 49
}
```

---

## 📝 Usage Examples

### Using Node.js/Axios:
```javascript
const axios = require('axios');

// Sync yesterday's data
const syncYesterday = async () => {
  const response = await axios.post(
    'http://localhost:5000/api/v1/sync/yesterday'
  );
  console.log(response.data);
};

// Sync specific date
const syncDate = async () => {
  const response = await axios.post(
    'http://localhost:5000/api/v1/sync/date',
    {
      date: '10-02-2026',
      state: 'Gujarat'
    }
  );
  console.log(response.data);
};

// Get status
const getStatus = async () => {
  const response = await axios.get(
    'http://localhost:5000/api/v1/sync/status'
  );
  console.log(response.data);
};
```

### Using Postman:
1. **Sync Yesterday:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/v1/sync/yesterday`
   - Body: None

2. **Sync Specific Date:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/v1/sync/date`
   - Body: `{ "date": "10-02-2026", "state": "Gujarat" }`

3. **Get Status:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/v1/sync/status`

---

## 🎯 Key Features

✅ **Automatic Entity Creation:** No need to manually add states, districts, markets, etc.

✅ **Duplicate Prevention:** Smart handling of existing records

✅ **Batch Processing:** Efficiently processes hundreds of records

✅ **Error Handling:** Detailed error reporting for failed records

✅ **Update Support:** Updates existing price records if already present

✅ **Date Flexibility:** Sync any historical date or yesterday's data

✅ **Statistics:** Real-time database statistics

---

## ⚠️ Important Notes

1. **Date Format:** Use `DD-MM-YYYY` format (e.g., `10-02-2026`)

2. **State:** Currently fixed to `Gujarat` for yesterday sync

3. **API Limits:** Maximum 3000 records per request from Data.gov.in

4. **Processing Time:** ~15-30 seconds for 800+ records

5. **Duplicate Handling:** Re-running sync for same date will update existing records

6. **Time Zone:** All dates are stored in UTC

---

## 🧪 Testing

Run the test script:
```bash
node testSync.js
```

This will:
1. Sync data for 10-02-2026
2. Display sync statistics
3. Show database counts

---

## 📈 Performance

- **First Sync (884 records):** ~15-20 seconds
- **Subsequent Syncs (same date):** ~10 seconds (only updates)
- **Database Operations:** Optimized with indexes
- **Memory Usage:** Efficient batch processing

---

## 🔮 Future Enhancements

- [ ] Scheduled automatic daily sync (cron job)
- [ ] Multiple state support in bulk
- [ ] Email notifications on sync completion
- [ ] Failed record retry mechanism
- [ ] Data validation before insertion
- [ ] Historical data backfill utility

---

## 🐛 Troubleshooting

**No records synced:**
- Check if data exists for that date on Data.gov.in
- Verify API key is correct in `.env`
- Check network connectivity

**Duplicate key errors:**
- System automatically handles duplicates
- Records will be updated instead of created

**Slow processing:**
- Normal for first-time sync (many entities to create)
- Subsequent syncs are faster (only price records updated)
