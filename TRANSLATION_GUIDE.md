# Translation Testing Guide

This guide helps you test English to Gujarati translation for commodity names using free Google Translate APIs.

## 📦 Installation

First, install one of these free translation packages:

### Option 1: @vitalets/google-translate-api (Recommended)
```bash
npm install @vitalets/google-translate-api
```

### Option 2: google-translate-api-x (More reliable fork)
```bash
npm install google-translate-api-x
```

### Option 3: @iamtraction/google-translate (Alternative)
```bash
npm install @iamtraction/google-translate
```

## 🚀 Usage

### Test Single Word Translation
```bash
npm run test:translate
# or with custom word
node scripts/testTranslation.js single groundnut
```

### Test Batch Translation (Multiple Commodities)
```bash
npm run test:translate:batch
```

### Create Translation Dictionary
```bash
npm run test:translate:dict
```

### Test All Translation Methods
```bash
node scripts/testTranslation.js all groundnut
```

## 📝 Examples

### Example 1: Translate "groundnut"
```bash
npm run test:translate
```

Output:
```
✅ @vitalets/google-translate-api:
   English: groundnut
   Gujarati: મગફળી
```

### Example 2: Batch translate common commodities
```bash
npm run test:translate:batch
```

This will translate:
- groundnut → મગફળી
- wheat → ઘઉં
- rice → ચોખા
- cotton → કપાસ
- onion → ડુંગળી
- potato → બટાટા
- And more...

### Example 3: Create a translation dictionary JSON
```bash
npm run test:translate:dict
```

This creates a JSON object with English-Gujarati pairs for all common commodities.

## 🔧 Advanced Usage

### Translate custom word
```bash
node scripts/testTranslation.js single "cotton"
```

### Command Options:
- `single [word]` - Test single word translation (default: "groundnut")
- `batch` - Test batch of common commodities
- `dictionary` - Create full translation dictionary as JSON
- `all [word]` - Try all available translation methods

## 💡 Implementation Ideas

### 1. Commodity Translation Service
Create a utility to translate commodity names in your API:

```javascript
const { translateWithVitalets } = require('./scripts/testTranslation');

async function getCommodityInGujarati(englishName) {
  return await translateWithVitalets(englishName, 'gu');
}
```

### 2. Pre-built Translation Dictionary
Store translations in your database or config file:

```javascript
const commodityTranslations = {
  'groundnut': 'મગફળી',
  'wheat': 'ઘઉં',
  'rice': 'ચોખા',
  // ... more commodities
};
```

### 3. Real-time Translation API Endpoint
Add an API endpoint for real-time translation:

```javascript
app.get('/api/translate/:word', async (req, res) => {
  const translation = await translateWithVitalets(req.params.word, 'gu');
  res.json({ english: req.params.word, gujarati: translation });
});
```

### 4. Batch Update Existing Records
Add Gujarati translations to existing commodity records:

```javascript
const commodities = await Commodity.find({});
for (const commodity of commodities) {
  const gujaratiName = await translateWithVitalets(commodity.name, 'gu');
  commodity.gujaratiName = gujaratiName;
  await commodity.save();
}
```

## ⚠️ Important Notes

1. **Rate Limiting**: Free APIs have rate limits. Add delays between requests:
   ```javascript
   await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
   ```

2. **Error Handling**: Always wrap translation calls in try-catch:
   ```javascript
   try {
     const translation = await translateWord('groundnut');
   } catch (error) {
     console.error('Translation failed:', error.message);
   }
   ```

3. **Caching**: For production, cache translations in database to avoid repeated API calls.

4. **Fallback**: Keep English names as fallback if translation fails.

## 🎯 Recommended Approach for Production

1. Run `npm run test:translate:dict` to create a translation dictionary
2. Store the dictionary in a JSON file or database
3. Use cached translations instead of real-time API calls
4. Update dictionary periodically for new commodities

## 📊 Expected Output Format

```json
{
  "word": "groundnut",
  "translations": {
    "vitalets": "મગફળી",
    "apiX": "મગફળી",
    "iamtraction": "મગફળી"
  }
}
```

## 🌐 Supported Languages

While this test focuses on Gujarati (`gu`), you can translate to other languages:
- Hindi: `hi`
- Marathi: `mr`
- Tamil: `ta`
- Telugu: `te`
- Kannada: `kn`
- Bengali: `bn`

Example:
```javascript
await translateWithVitalets('groundnut', 'hi'); // Hindi
await translateWithVitalets('groundnut', 'mr'); // Marathi
```

## 🤝 Contributing

Feel free to add more translation methods or improve the existing ones!
