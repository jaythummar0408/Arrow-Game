# Last 30 Days Sync Script Documentation

## 🎯 Overview

The `syncLast30Days.js` script automatically syncs historical data for the last N days from Data.gov.in API. It processes each day sequentially and adds all records to your database.

## ✅ Test Results (3 Days)

```
⏱️  Total Time: 10.57 seconds
📅 Days Processed: 3
✅ Successful Days: 3
❌ Failed Days: 0
⚠️  Days with No Data: 0

📈 Records Summary:
   Total Records: 2,056
   Created: 1,172
   Updated: 884
   Errors: 0
```

### Day-by-Day Breakdown:
- **08-02-2026**: 213 records created
- **09-02-2026**: 959 records created  
- **10-02-2026**: 884 records updated (already existed)

## 🚀 Usage

### Method 1: Direct Command
```bash
node scripts/syncLast30Days.js [days]
```

**Examples:**
```bash
# Sync last 30 days (default)
node scripts/syncLast30Days.js

# Sync last 7 days
node scripts/syncLast30Days.js 7

# Sync last 3 days
node scripts/syncLast30Days.js 3

# Sync last 90 days
node scripts/syncLast30Days.js 90
```

### Method 2: NPM Scripts
```bash
# Sync last 30 days
npm run sync:30days

# Sync last 7 days
npm run sync:7days
```

## 🔧 How It Works

### Sequential Processing Flow:

1. **Calculate Dates**
   - Gets today's date
   - Calculates last N days
   - Creates date range (oldest to newest)

2. **For Each Day (Sequential):**
   ```
   Day 1 → Fetch API → Process → Save to DB
   Day 2 → Fetch API → Process → Save to DB
   Day 3 → Fetch API → Process → Save to DB
   ...
   Day N → Fetch API → Process → Save to DB
   ```

3. **Processing Each Day:**
   - Fetch data from Data.gov.in API
   - Check if records exist for that date
   - Process each record:
     - Create/find State, District, Market
     - Create/find Commodity, Variety, Grade
     - Create or Update price record
   - Show progress and statistics

4. **Final Summary:**
   - Total records processed
   - Created vs Updated
   - Failed days (if any)
   - Days with no data (if any)
   - Total execution time

## 📊 Output Format

### During Processing:
```
[1/30] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Syncing data for Gujarat - 08-02-2026
   📥 Fetched 213 records
   ⚙️  Processing...
   ✅ Created: 213
   🔄 Updated: 0

[2/30] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Syncing data for Gujarat - 09-02-2026
   📥 Fetched 959 records
   ⚙️  Processing...
   ✅ Created: 959
   🔄 Updated: 0
```

### Final Summary:
```
======================================================================
📊 FINAL SUMMARY
======================================================================
⏱️  Total Time: 10.57 seconds
📅 Days Processed: 30
✅ Successful Days: 28
❌ Failed Days: 0
⚠️  Days with No Data: 2

📈 Records Summary:
   Total Records: 25,340
   Created: 24,456
   Updated: 884
   Errors: 0
======================================================================
```

## 🎯 Key Features

✅ **Sequential Processing** - One day at a time (no race conditions)

✅ **Progress Tracking** - Shows real-time progress for each day

✅ **Automatic Retry** - Handles API errors gracefully

✅ **Rate Limiting** - 1 second delay between requests

✅ **Smart Updates** - Updates existing records, creates new ones

✅ **Comprehensive Summary** - Detailed statistics at the end

✅ **Flexible Days** - Sync any number of days (1-365)

✅ **Error Reporting** - Lists failed days with reasons

✅ **No Data Detection** - Identifies days with no data

## ⚙️ Configuration

### Current Settings:
- **State:** Gujarat (fixed)
- **API Limit:** 3000 records per day
- **Delay Between Days:** 1 second
- **Date Range:** Last N days (configurable)
- **Date Format:** DD-MM-YYYY

### Modify State:
Edit the `syncDateData` function in `scripts/syncLast30Days.js`:
```javascript
const syncDateData = async (date, state = "Gujarat") => {
  // Change "Gujarat" to your desired state
}
```

## 📈 Performance Estimates

Based on test results:

| Days | Est. Records | Est. Time | Database Size |
|------|--------------|-----------|---------------|
| 3    | ~2,000       | ~10 sec   | ~2 MB         |
| 7    | ~6,000       | ~30 sec   | ~5 MB         |
| 15   | ~12,000      | ~60 sec   | ~10 MB        |
| 30   | ~25,000      | ~2 min    | ~20 MB        |
| 90   | ~75,000      | ~6 min    | ~60 MB        |

*Note: Times may vary based on network speed and existing data*

## ⚠️ Important Notes

1. **Run Once:** Only run this script once for initial data sync

2. **No Duplicates:** Safe to re-run - will update existing records

3. **Network Required:** Requires stable internet connection

4. **Database Space:** Ensure adequate database storage

5. **API Limits:** Respects Data.gov.in rate limits (1 sec delay)

6. **Date Range:** Maximum 365 days recommended

7. **Time Zone:** All dates in IST, stored as UTC

## 🔍 Error Handling

### Days with No Data:
```
⚠️  Days with No Data:
   12-02-2026
   13-02-2026
```
*Normal - Some days may not have data available*

### Failed Days:
```
❌ Failed Days:
   14-02-2026: Network timeout
   15-02-2026: API rate limit exceeded
```
*Re-run script to retry failed days*

### Common Issues:

**Network Timeout:**
- Solution: Check internet connection, re-run script

**API Rate Limit:**
- Solution: Wait 5 minutes, re-run script

**Database Connection Lost:**
- Solution: Check MongoDB is running, restart script

## 🧪 Testing

### Test with Small Range:
```bash
# Test with 1 day
node scripts/syncLast30Days.js 1

# Test with 3 days
node scripts/syncLast30Days.js 3
```

### Verify Data in Database:
```bash
# Check sync status
curl http://localhost:5000/api/v1/sync/status
```

## 📝 Use Cases

### Initial Setup:
```bash
# Sync last 30 days of historical data
node scripts/syncLast30Days.js 30
```

### Weekly Backfill:
```bash
# Sync last 7 days every week
node scripts/syncLast30Days.js 7
```

### Monthly Archive:
```bash
# Sync entire last month
node scripts/syncLast30Days.js 30
```

### First-Time Setup:
```bash
# Sync last 3 months of data
node scripts/syncLast30Days.js 90
```

## 🔮 Automation (Future)

### Cron Job (Linux/Mac):
```bash
# Run daily at 2 AM to sync previous day
0 2 * * * cd /path/to/project && node scripts/syncLast30Days.js 1
```

### Task Scheduler (Windows):
```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/syncLast30Days.js 1" -WorkingDirectory "C:\path\to\project"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "APMC Daily Sync"
```

## 💡 Pro Tips

1. **First Run:** Start with 3-7 days to test
2. **Weekend Sync:** Run on weekends for better performance
3. **Monitor Progress:** Watch for any error messages
4. **Check Database:** Verify data after completion
5. **Re-run Safe:** Safe to re-run - will update existing data
6. **Split Large Ranges:** For 90+ days, split into smaller chunks

## 🎬 Complete Example

```bash
# Step 1: Test with 1 day
node scripts/syncLast30Days.js 1

# Step 2: If successful, try 7 days
node scripts/syncLast30Days.js 7

# Step 3: Run full 30 days
node scripts/syncLast30Days.js 30

# Step 4: Check database statistics
curl http://localhost:5000/api/v1/sync/status
```

## 📞 Support

If sync fails or encounters issues:
1. Check MongoDB is running
2. Verify internet connection
3. Check API key in `.env` file
4. Review error messages in console
5. Try smaller date range first
6. Re-run script (safe to retry)
