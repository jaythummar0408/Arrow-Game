# Translation Helper - Usage Guide

A powerful translation helper utility for English to Gujarati translation with caching and pre-built dictionary.

## Features

✅ **Pre-built Dictionary** - 80+ common commodities with instant translation  
✅ **Smart Caching** - Avoids repeated API calls  
✅ **Batch Translation** - Translate multiple items efficiently  
✅ **Fallback Support** - Returns original text if translation fails  
✅ **Multi-language** - Support for Hindi, Marathi, and other languages  
✅ **Zero Configuration** - Works out of the box  

## Installation

Package already installed: `@vitalets/google-translate-api`

## Quick Start

```javascript
const { translateText, getCommodityGujaratiName } = require('./utils/translate');

// Simple translation
const result = await translateText('groundnut');
console.log(result); // મગફળી

// Commodity translation (uses dictionary - instant!)
const gujarati = await getCommodityGujaratiName('wheat');
console.log(gujarati); // ઘઉં
```

## API Reference

### `translateText(text, options)`

Translate text from English to Gujarati.

**Parameters:**
- `text` (string) - Text to translate
- `options` (object)
  - `targetLang` (string) - Target language code (default: 'gu')
  - `useCache` (boolean) - Use cache (default: true)
  - `useDictionary` (boolean) - Check dictionary first (default: true)

**Returns:** Promise<string|null>

**Example:**
```javascript
const gujarati = await translateText('potato');
// Returns: બટાકા
```

### `getCommodityGujaratiName(commodityName)`

Get Gujarati name for commodity. Uses dictionary first (instant), falls back to API.

**Parameters:**
- `commodityName` (string) - English commodity name

**Returns:** Promise<string|null>

**Example:**
```javascript
const name = await getCommodityGujaratiName('rice');
// Returns: ચોખા (instant from dictionary)
```

### `translateBatch(texts, options)`

Translate multiple texts with automatic rate limiting.

**Parameters:**
- `texts` (string[]) - Array of texts to translate
- `options` (object)
  - `delay` (number) - Delay between requests in ms (default: 500)

**Returns:** Promise<Object>

**Example:**
```javascript
const results = await translateBatch(['wheat', 'rice', 'cotton'], { delay: 300 });
// Returns: { wheat: 'ઘઉં', rice: 'ચોખા', cotton: 'કપાસ' }
```

### `translateWithFallback(text, options)`

Translate with fallback to original text if translation fails.

**Parameters:**
- `text` (string) - Text to translate
- `options` (object) - Same as translateText

**Returns:** Promise<string>

**Example:**
```javascript
const result = await translateWithFallback('banana');
// Always returns a string (translation or original)
```

### `isInDictionary(text)`

Check if translation exists in pre-built dictionary.

**Parameters:**
- `text` (string) - Text to check

**Returns:** boolean

**Example:**
```javascript
if (isInDictionary('wheat')) {
  console.log('Translation available instantly!');
}
```

### `getFromDictionary(text)`

Get translation from dictionary only (no API call).

**Parameters:**
- `text` (string) - Text to translate

**Returns:** string|null

**Example:**
```javascript
const gujarati = getFromDictionary('onion');
// Returns: ડુંગળી (instant, no API call)
```

### `addToDictionary(english, gujarati)`

Add custom translation to dictionary.

**Parameters:**
- `english` (string) - English text
- `gujarati` (string) - Gujarati translation

**Example:**
```javascript
addToDictionary('dragon fruit', 'ડ્રેગન ફ્રુટ');
```

### `getCacheStats()`

Get cache and dictionary statistics.

**Returns:** Object with `cacheSize` and `dictionarySize`

**Example:**
```javascript
const stats = getCacheStats();
console.log(stats);
// { cacheSize: 5, dictionarySize: 80 }
```

### `clearCache()`

Clear translation cache.

**Example:**
```javascript
clearCache();
```

## Usage Examples

### Example 1: Simple Translation
```javascript
const { translateText } = require('./utils/translate');

const result = await translateText('groundnut');
console.log(result); // મગફળી
```

### Example 2: Enrich API Response
```javascript
const { getCommodityGujaratiName } = require('./utils/translate');

const commodities = await Commodity.find({});

const enriched = await Promise.all(
  commodities.map(async (commodity) => ({
    ...commodity.toObject(),
    nameGujarati: await getCommodityGujaratiName(commodity.name),
  }))
);
```

### Example 3: Batch Translation
```javascript
const { translateBatch } = require('./utils/translate');

const commodities = ['wheat', 'rice', 'cotton', 'onion'];
const translations = await translateBatch(commodities);

console.log(translations);
// {
//   wheat: 'ઘઉં',
//   rice: 'ચોખા',
//   cotton: 'કપાસ',
//   onion: 'ડુંગળી'
// }
```

### Example 4: Check Dictionary First
```javascript
const { isInDictionary, getFromDictionary, translateText } = require('./utils/translate');

const commodity = 'wheat';

if (isInDictionary(commodity)) {
  // Instant translation from dictionary
  console.log(getFromDictionary(commodity)); // ઘઉં
} else {
  // API call needed
  console.log(await translateText(commodity));
}
```

### Example 5: Multi-language Support
```javascript
const { translateText } = require('./utils/translate');

const word = 'groundnut';

const gujarati = await translateText(word, { targetLang: 'gu' });
const hindi = await translateText(word, { targetLang: 'hi' });
const marathi = await translateText(word, { targetLang: 'mr' });

console.log({ gujarati, hindi, marathi });
// {
//   gujarati: 'મગફળી',
//   hindi: 'मूंगफली',
//   marathi: 'शेंगदाणा'
// }
```

## Pre-built Dictionary

The helper includes 80+ common commodities:

**Grains:** wheat, rice, maize, bajra, jowar, barley  
**Pulses:** chickpea, lentil, pigeon_pea, green_gram  
**Oilseeds:** groundnut, soybean, mustard, sesame  
**Vegetables:** onion, potato, tomato, garlic, ginger  
**Fruits:** mango, banana, apple, orange, papaya  
**Spices:** turmeric, cumin, coriander, cardamom  
**Fiber:** cotton, jute  

[View full dictionary in utils/translate.js]

## Testing

Run the test examples:

```bash
# Test the helper with all examples
npm run test:translate:helper

# Or directly
node scripts/testTranslateHelper.js
```

## Performance Tips

1. **Use Dictionary First** - 80+ commodities translate instantly
2. **Enable Caching** - Avoid repeated API calls
3. **Batch Operations** - Use `translateBatch` for multiple items
4. **Add Custom Translations** - Use `addToDictionary` for frequently used terms

## Rate Limiting

The free Google Translate API has rate limits. Best practices:

- Use dictionary for common commodities (no API call)
- Enable caching (default)
- Add delays in batch operations (default: 500ms)
- Store translations in database for production

## Production Usage

For production, consider:

1. **Pre-translate all commodities** and store in database
2. **Use cached translations** from database
3. **Only translate new items** via API
4. **Schedule batch updates** during off-peak hours

Example:
```javascript
// One-time setup: Translate and store all commodities
const commodities = await Commodity.find({});

for (const commodity of commodities) {
  commodity.gujaratiName = await getCommodityGujaratiName(commodity.name);
  await commodity.save();
}
```

## Error Handling

All functions handle errors gracefully:

```javascript
const result = await translateText('invalid');
// Returns null on error

const result = await translateWithFallback('invalid');
// Returns 'invalid' (original text) on error
```

## Support

For issues or questions, check:
- [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md) - Complete setup guide
- [scripts/testTranslateHelper.js](scripts/testTranslateHelper.js) - Working examples
