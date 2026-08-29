# Gujarati Names Feature - Complete Guide

This guide explains how Gujarati names (`name_gj` field) are implemented across all models and how to use the update scripts.

## 📋 What's Changed

### 1. Models Updated
All models with `name` field now have `name_gj` field (Gujarati name):

- ✅ **Commodity** - Commodity names in Gujarati
- ✅ **State** - State names in Gujarati
- ✅ **District** - District names in Gujarati
- ✅ **Market** - Market names in Gujarati
- ✅ **Variety** - Variety names in Gujarati
- ✅ **Grade** - Grade names in Gujarati

### 2. Field Specification
```javascript
name_gj: {
  type: String,
  trim: true,
  // Not required - can be null/empty
}
```

### 3. Data Sync Updated
The `dataProcessor.js` now automatically translates and stores Gujarati names when creating new records during sync operations.

## 🚀 Usage

### Update Existing Records

To update all existing records in your database with Gujarati names:

```bash
npm run update:gujarati
```

Or directly:
```bash
node scripts/updateGujaratiNames.js
```

This script will:
- Find all records without `name_gj`
- Translate English names to Gujarati
- Update records in the database
- Provide detailed progress and summary

### Expected Output

```
🔤 UPDATING GUJARATI NAMES FOR ALL RECORDS

============================================================
Updating Commodity records...
============================================================
Found 45 Commodity records to update
✓ Wheat → ઘઉં (ID: 607f1f77bcf86cd799439011)
✓ Rice → ચોખા (ID: 607f1f77bcf86cd799439012)
...

Commodity Summary:
  ✅ Updated: 45
  ❌ Failed: 0
  Total: 45

============================================================
OVERALL SUMMARY
============================================================

By Model:
  commodity    : ✅ 45 updated, ❌ 0 failed
  variety      : ✅ 12 updated, ❌ 0 failed
  grade        : ✅ 8 updated, ❌ 0 failed
  state        : ✅ 5 updated, ❌ 0 failed
  district     : ✅ 23 updated, ❌ 0 failed
  market       : ✅ 67 updated, ❌ 0 failed

Total:
  ✅ Total Updated: 160
  ❌ Total Failed: 0
```

## 🔄 Automatic Translation During Sync

When you run sync operations, new records automatically get Gujarati names:

```javascript
// Example: Creating a new commodity
const commodity = await getOrCreateCommodity("Groundnut", 1001);
// Result: { name: "Groundnut", name_gj: "મગફળી", commodity_code: 1001 }
```

### Sync Commands Still Work:
```bash
npm run sync:30days  # Syncs last 30 days with Gujarati names
npm run sync:7days   # Syncs last 7 days with Gujarati names
```

## 📊 API Response Changes

All API responses now include Gujarati names:

### Before:
```json
{
  "_id": "607f1f77bcf86cd799439011",
  "name": "Wheat",
  "commodity_code": 101
}
```

### After:
```json
{
  "_id": "607f1f77bcf86cd799439011",
  "name": "Wheat",
  "name_gj": "ઘઉં",
  "commodity_code": 101
}
```

## 🔧 How It Works

### 1. Translation Helper
Uses the translation helper utility:
```javascript
const { getCommodityGujaratiName } = require('./utils/translate');

const gujaratiName = await getCommodityGujaratiName('Wheat');
// Returns: "ઘઉં"
```

### 2. Smart Translation
- **Dictionary First**: Common items translate instantly from pre-built dictionary
- **API Fallback**: Uncommon items use Google Translate API
- **Caching**: Results are cached to avoid repeated API calls
- **Rate Limiting**: Automatic delays prevent API rate limits

### 3. Data Flow

```
API Data → dataProcessor.js → Translation → Database
                ↓
         getOrCreateCommodity()
                ↓
         getCommodityGujaratiName()
                ↓ (checks dictionary)
         "Wheat" → "ઘઉં"
                ↓
         Save to DB with name_gj
```

## 📝 Model Examples

### Commodity Model
```javascript
{
  name: "Groundnut",
  name_gj: "મગફળી",
  commodity_code: 1001
}
```

### Market Model
```javascript
{
  name: "Ahmedabad Market",
  name_gj: "અમદાવાદ માર્કેટ",
  district: ObjectId("..."),
  state: ObjectId("...")
}
```

### State Model
```javascript
{
  name: "Gujarat",
  name_gj: "ગુજરાત"
}
```

## ⚠️ Important Notes

### 1. Existing Data
- Run `npm run update:gujarati` ONCE after deployment to update existing records
- This is a one-time operation for existing data
- New data will automatically have Gujarati names

### 2. Rate Limiting
- The update script includes 300ms delays between translations
- This prevents Google Translate API rate limits
- For large datasets, the script may take several minutes

### 3. Failed Translations
- If translation fails, `name_gj` remains null
- The record is still saved with English name
- Re-run the script to retry failed translations

### 4. Null Values
- `name_gj` can be null or empty (not required)
- If null, frontend can fallback to English `name`
- Queries work whether `name_gj` is present or not

## 🎯 Best Practices

### 1. Frontend Display
```javascript
// Always provide fallback to English name
const displayName = record.name_gj || record.name;
```

### 2. Search/Filter
```javascript
// Search both English and Gujarati names
const results = await Commodity.find({
  $or: [
    { name: new RegExp(searchTerm, 'i') },
    { name_gj: new RegExp(searchTerm, 'i') }
  ]
});
```

### 3. API Responses
Include both names in responses for flexibility:
```json
{
  "name": "Wheat",
  "name_gj": "ઘઉં",
  "displayName": "ઘઉં (Wheat)"
}
```

## 🐛 Troubleshooting

### Issue: Update Script Fails
**Solution**: Check MongoDB connection in `.env` file

### Issue: Too Many API Requests
**Solution**: Increase delay in script:
```javascript
await new Promise((resolve) => setTimeout(resolve, 500)); // Increase to 1000
```

### Issue: Some Translations Missing
**Solution**: Re-run update script - it only updates records without `name_gj`

### Issue: Translation Not Accurate
**Solution**: Add custom translation to dictionary:
```javascript
const { addToDictionary } = require('./utils/translate');
addToDictionary('special_term', 'વિશેષ શબ્દ');
```

## 📚 Related Files

- **Models**: `models/*.model.js` - All models with name_gj field
- **Translation**: `utils/translate.js` - Translation helper
- **Data Processor**: `utils/dataProcessor.js` - Handles sync with translation
- **Update Script**: `scripts/updateGujaratiNames.js` - One-time update script
- **Translation Guide**: `utils/README_TRANSLATE.md` - Translation helper docs

## 🚦 Deployment Checklist

- [ ] **Deploy code** with updated models
- [ ] **Run update script**: `npm run update:gujarati`
- [ ] **Verify data** - Check database for name_gj values
- [ ] **Test sync** - Run sync and verify new records have name_gj
- [ ] **Update frontend** to display Gujarati names
- [ ] **Test APIs** - Verify responses include name_gj

## 📊 Statistics

After running the update script, you can check:

```javascript
// Check how many records have Gujarati names
const commoditiesWithGj = await Commodity.countDocuments({ name_gj: { $ne: null } });
const totalCommodities = await Commodity.countDocuments({});
console.log(`${commoditiesWithGj} / ${totalCommodities} commodities have Gujarati names`);
```

## 🎉 Summary

✅ **All models updated** with `name_gj` field  
✅ **Update script created** to populate existing records  
✅ **Sync process updated** to auto-translate new records  
✅ **Translation helper** with caching and dictionary  
✅ **Rate limiting** to avoid API issues  
✅ **Fallback support** - works with or without translations  

Your APMC application now fully supports bilingual (English + Gujarati) data! 🇮🇳
