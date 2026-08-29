# 🔔 Price Alert API Guide - APMC Khetivadi

Complete guide for implementing price alert functionality for farmers to get notified when commodity prices reach their target thresholds.

## 📋 Overview

The Price Alert system allows farmers to:
- Set price alerts for specific commodities in specific markets
- Define target price with upper and lower thresholds
- Receive notifications when prices match their criteria
- Manage multiple alerts across different commodities
- Track alert history and statistics

**Base URL:** `http://your-server-url.com/api/v1/alerts`

---

## 🔐 Authentication

All alert endpoints require JWT authentication.

**Header Required:**
```
Authorization: Bearer {access_token}
```

---

## 📚 API Endpoints Summary

| # | Endpoint | Method | Purpose | Auth Required |
|---|----------|--------|---------|---------------|
| 1 | `/alerts` | POST | Create new price alert | ✅ Yes |
| 2 | `/alerts` | GET | Get all user's alerts | ✅ Yes |
| 3 | `/alerts/stats` | GET | Get alert statistics | ✅ Yes |
| 4 | `/alerts/:id` | GET | Get single alert details | ✅ Yes |
| 5 | `/alerts/:id` | PUT | Update alert | ✅ Yes |
| 6 | `/alerts/:id` | DELETE | Delete alert | ✅ Yes |
| 7 | `/alerts/:id/toggle` | POST | Toggle alert active status | ✅ Yes |

---

## 📌 API 1: Create Price Alert

**Purpose:** Create a new price alert for a commodity in a specific market

**Endpoint:** `POST /api/v1/alerts`

**Authentication:** Required (Bearer Token)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Request Body

```json
{
  "districtId": "65a1234567890abcdef12345",
  "marketId": "65a1234567890abcdef12346",
  "commodityId": "65a1234567890abcdef12347",
  "varietyId": "65a1234567890abcdef12348",
  "gradeId": "65a1234567890abcdef12349",
  "targetPrice": 3500,
  "upperPrice": 4000,
  "lowerPrice": 3000,
  "alertType": "both"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `districtId` | String (ObjectId) | ✅ Yes | District ID where market is located |
| `marketId` | String (ObjectId) | ✅ Yes | Market ID to monitor |
| `commodityId` | String (ObjectId) | ✅ Yes | Commodity ID to track |
| `varietyId` | String (ObjectId) | ❌ Optional | Specific variety (null = any variety) |
| `gradeId` | String (ObjectId) | ❌ Optional | Specific grade (null = any grade) |
| `targetPrice` | Number | ✅ Yes | Target price you're aiming for |
| `upperPrice` | Number | ✅ Yes | Alert when price goes above this |
| `lowerPrice` | Number | ✅ Yes | Alert when price goes below this |
| `alertType` | String | ❌ Optional | Alert trigger type: `"min"`, `"max"`, `"target"`, `"both"` (default: `"both"`) |

**Alert Types:**
- `"min"` - Alert only when price drops to or below lowerPrice
- `"max"` - Alert only when price rises to or above upperPrice
- `"target"` - Alert only when price is near targetPrice (±1%)
- `"both"` - Alert for both upper and lower thresholds (default)

**Validation Rules:**
- `upperPrice` must be ≥ `targetPrice`
- `lowerPrice` must be ≤ `targetPrice`
- Cannot create duplicate alert for same market-commodity-variety-grade combination

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Price alert created successfully",
  "data": {
    "alert": {
      "_id": "65a1234567890abcdef1234a",
      "user": "65a1234567890abcdef12340",
      "district": {
        "_id": "65a1234567890abcdef12345",
        "name": "Ahmedabad",
        "nameGuj": "અમદાવાદ"
      },
      "market": {
        "_id": "65a1234567890abcdef12346",
        "name": "Naroda APMC",
        "nameGuj": "નરોડા એપીએમસી"
      },
      "commodity": {
        "_id": "65a1234567890abcdef12347",
        "name": "Wheat",
        "nameGuj": "ઘઉં"
      },
      "variety": {
        "_id": "65a1234567890abcdef12348",
        "name": "Lokwan",
        "nameGuj": "લોકવાન"
      },
      "grade": {
        "_id": "65a1234567890abcdef12349",
        "name": "FAQ",
        "nameGuj": "એફએક્યુ"
      },
      "targetPrice": 3500,
      "upperPrice": 4000,
      "lowerPrice": 3000,
      "isActive": true,
      "alertType": "both",
      "notificationSent": false,
      "triggeredCount": 0,
      "lastTriggeredAt": null,
      "createdAt": "2026-02-17T10:30:00.000Z",
      "updatedAt": "2026-02-17T10:30:00.000Z"
    }
  }
}
```

### Error Responses

**400 Bad Request - Missing Fields:**
```json
{
  "success": false,
  "message": "District, Market, and Commodity are required"
}
```

**400 Bad Request - Invalid Price Logic:**
```json
{
  "success": false,
  "message": "Upper price must be greater than or equal to target price"
}
```

**400 Bad Request - Duplicate Alert:**
```json
{
  "success": false,
  "message": "An active alert already exists for this market-commodity combination. Please update or delete the existing alert.",
  "data": {
    "existingAlertId": "65a1234567890abcdef1234a"
  }
}
```

**404 Not Found - Invalid Reference:**
```json
{
  "success": false,
  "message": "Market not found"
}
```

---

## 📌 API 2: Get All User Alerts

**Purpose:** Get all price alerts for the logged-in user

**Endpoint:** `GET /api/v1/alerts`

**Authentication:** Required (Bearer Token)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isActive` | Boolean | ❌ Optional | Filter by active status (`true`/`false`) |
| `market` | String | ❌ Optional | Filter by market ID |
| `commodity` | String | ❌ Optional | Filter by commodity ID |

### Examples

```
GET /api/v1/alerts
GET /api/v1/alerts?isActive=true
GET /api/v1/alerts?market=65a1234567890abcdef12346
GET /api/v1/alerts?commodity=65a1234567890abcdef12347&isActive=true
```

### Success Response (200 OK)

```json
{
  "success": true,
  "count": 3,
  "data": {
    "alerts": [
      {
        "_id": "65a1234567890abcdef1234a",
        "district": {
          "_id": "65a1234567890abcdef12345",
          "name": "Ahmedabad",
          "nameGuj": "અમદાવાદ"
        },
        "market": {
          "_id": "65a1234567890abcdef12346",
          "name": "Naroda APMC",
          "nameGuj": "નરોડા એપીએમસી"
        },
        "commodity": {
          "_id": "65a1234567890abcdef12347",
          "name": "Wheat",
          "nameGuj": "ઘઉં"
        },
        "targetPrice": 3500,
        "upperPrice": 4000,
        "lowerPrice": 3000,
        "isActive": true,
        "alertType": "both",
        "notificationSent": false,
        "triggeredCount": 2,
        "lastTriggeredAt": "2026-02-16T15:30:00.000Z",
        "createdAt": "2026-02-15T10:30:00.000Z",
        "updatedAt": "2026-02-16T15:30:00.000Z"
      }
      // ... more alerts
    ]
  }
}
```

---

## 📌 API 3: Get Alert Statistics

**Purpose:** Get statistics about user's alerts

**Endpoint:** `GET /api/v1/alerts/stats`

**Authentication:** Required (Bearer Token)

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 10,
      "active": 7,
      "inactive": 3,
      "triggered": 4,
      "pending": 6
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `total` | Total number of alerts created |
| `active` | Currently active alerts |
| `inactive` | Deactivated alerts |
| `triggered` | Alerts that have been triggered |
| `pending` | Active alerts waiting to be triggered |

---

## 📌 API 4: Get Single Alert

**Purpose:** Get details of a specific alert

**Endpoint:** `GET /api/v1/alerts/:id`

**Authentication:** Required (Bearer Token)

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Alert ID (MongoDB ObjectId) |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "alert": {
      "_id": "65a1234567890abcdef1234a",
      "district": {
        "_id": "65a1234567890abcdef12345",
        "name": "Ahmedabad",
        "nameGuj": "અમદાવાદ"
      },
      "market": {
        "_id": "65a1234567890abcdef12346",
        "name": "Naroda APMC",
        "nameGuj": "નરોડા એપીએમસી"
      },
      "commodity": {
        "_id": "65a1234567890abcdef12347",
        "name": "Wheat",
        "nameGuj": "ઘઉં"
      },
      "targetPrice": 3500,
      "upperPrice": 4000,
      "lowerPrice": 3000,
      "isActive": true,
      "alertType": "both",
      "notificationSent": false,
      "triggeredCount": 2,
      "lastTriggeredAt": "2026-02-16T15:30:00.000Z",
      "createdAt": "2026-02-15T10:30:00.000Z",
      "updatedAt": "2026-02-16T15:30:00.000Z"
    }
  }
}
```

### Error Response

**404 Not Found:**
```json
{
  "success": false,
  "message": "Alert not found"
}
```

---

## 📌 API 5: Update Alert

**Purpose:** Update an existing alert

**Endpoint:** `PUT /api/v1/alerts/:id`

**Authentication:** Required (Bearer Token)

### Request Body (All fields optional)

```json
{
  "targetPrice": 3600,
  "upperPrice": 4100,
  "lowerPrice": 3100,
  "isActive": true,
  "alertType": "both",
  "varietyId": "65a1234567890abcdef12348",
  "gradeId": "65a1234567890abcdef12349"
}
```

**Note:** Updating prices will reset the `notificationSent` flag, allowing the alert to trigger again.

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Alert updated successfully",
  "data": {
    "alert": {
      // ... updated alert object
    }
  }
}
```

---

## 📌 API 6: Delete Alert

**Purpose:** Delete a price alert

**Endpoint:** `DELETE /api/v1/alerts/:id`

**Authentication:** Required (Bearer Token)

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Alert deleted successfully"
}
```

### Error Response

**404 Not Found:**
```json
{
  "success": false,
  "message": "Alert not found"
}
```

---

## 📌 API 7: Toggle Alert Status

**Purpose:** Quickly activate/deactivate an alert

**Endpoint:** `POST /api/v1/alerts/:id/toggle`

**Authentication:** Required (Bearer Token)

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Alert activated successfully",
  "data": {
    "alert": {
      "_id": "65a1234567890abcdef1234a",
      "isActive": true,
      // ... rest of alert object
    }
  }
}
```

**Note:** Activating an alert resets the `notificationSent` flag.

---

## 🔄 Integration Flow

### Step 1: Get Required IDs

Before creating an alert, fetch the necessary IDs:

```javascript
// 1. Get districts
GET /api/v1/market-prices/hierarchy/districts

// 2. Get markets in selected district
GET /api/v1/market-prices/hierarchy/markets?district=<districtId>

// 3. Get commodities in selected market
GET /api/v1/market-prices/hierarchy/commodities?market=<marketId>

// 4. (Optional) Get varieties for selected commodity
GET /api/v1/market-prices/hierarchy/varieties?commodity=<commodityId>

// 5. (Optional) Get grades
GET /api/v1/market-prices/hierarchy/grades?commodity=<commodityId>
```

### Step 2: Get Current Market Price

Check current price to help user set realistic thresholds:

```javascript
GET /api/v1/market-prices?market=<marketId>&commodity=<commodityId>&limit=1&sortBy=arrival_date&sortOrder=desc
```

### Step 3: Create Alert

```javascript
POST /api/v1/alerts
Headers: {
  Authorization: Bearer <access_token>
}
Body: {
  districtId: "...",
  marketId: "...",
  commodityId: "...",
  targetPrice: 3500,
  upperPrice: 4000,
  lowerPrice: 3000,
  alertType: "both"
}
```

### Step 4: Display User's Alerts

```javascript
GET /api/v1/alerts?isActive=true
```

### Step 5: Manage Alerts

```javascript
// Update alert
PUT /api/v1/alerts/:id

// Deactivate alert
POST /api/v1/alerts/:id/toggle

// Delete alert
DELETE /api/v1/alerts/:id
```

---

## 📱 React Native Implementation Example

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const createPriceAlert = async (alertData) => {
  try {
    // Get access token
    const token = await AsyncStorage.getItem('access_token');
    
    const response = await fetch('http://your-server/api/v1/alerts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        districtId: alertData.districtId,
        marketId: alertData.marketId,
        commodityId: alertData.commodityId,
        targetPrice: alertData.targetPrice,
        upperPrice: alertData.upperPrice,
        lowerPrice: alertData.lowerPrice,
        alertType: alertData.alertType || 'both',
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Alert created:', data.data.alert);
      return data.data.alert;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};

// Usage
const alert = await createPriceAlert({
  districtId: '65a1234567890abcdef12345',
  marketId: '65a1234567890abcdef12346',
  commodityId: '65a1234567890abcdef12347',
  targetPrice: 3500,
  upperPrice: 4000,
  lowerPrice: 3000,
  alertType: 'both',
});
```

---

## 🎯 Best Practices

### 1. Alert Creation
- Always validate user inputs before sending to API
- Show current market price to help users set realistic thresholds
- Suggest reasonable price ranges based on historical data
- Limit number of active alerts per user (suggest: max 10)

### 2. Alert Management
- Show alert status clearly (active/inactive, triggered/pending)
- Allow quick toggle for enabling/disabling alerts
- Provide easy way to update thresholds without recreating alert
- Show alert history (last triggered date, trigger count)

### 3. User Experience
- Send push notifications when alerts are triggered
- Show visual indicators for price movements relative to alert thresholds
- Allow bulk operations (activate/deactivate multiple alerts)
- Provide alert templates for common scenarios

### 4. Performance
- Cache district/market/commodity lists locally
- Implement pagination for alert lists if user has many alerts
- Use optimistic updates for toggle operations

---

## 🔔 Notification System (Future Enhancement)

The alert model includes fields for notification tracking (`notificationSent`, `lastTriggeredAt`, `triggeredCount`). 

To implement notifications:

1. **Background Job**: Check alerts against current market prices periodically
2. **Trigger Detection**: Use `alert.checkPrice(currentPrice)` method
3. **Send Notification**: Via push notification service (FCM/APNS)
4. **Update Alert**: Call `alert.trigger()` to mark as sent
5. **Reset Option**: Let users reset triggered alerts with `alert.reset()`

---

## 📊 Common Use Cases

### Use Case 1: Simple Price Alert
Farmer wants to be notified when wheat price goes above ₹4000 in Naroda APMC.

```json
{
  "marketId": "...",
  "commodityId": "...",
  "targetPrice": 4000,
  "upperPrice": 4000,
  "lowerPrice": 0,
  "alertType": "max"
}
```

### Use Case 2: Buy/Sell Window
Farmer wants to sell when price is between ₹3800-4200.

```json
{
  "marketId": "...",
  "commodityId": "...",
  "targetPrice": 4000,
  "upperPrice": 4200,
  "lowerPrice": 3800,
  "alertType": "target"
}
```

### Use Case 3: Price Drop Alert
Farmer wants to be notified if price drops below ₹3000 (emergency alert).

```json
{
  "marketId": "...",
  "commodityId": "...",
  "targetPrice": 3500,
  "upperPrice": 5000,
  "lowerPrice": 3000,
  "alertType": "min"
}
```

---

## ❓ FAQ

**Q: Can I create multiple alerts for the same commodity?**
A: No, only one active alert per market-commodity-variety-grade combination. Update or delete the existing one.

**Q: What happens when an alert is triggered?**
A: The `notificationSent` flag is set to `true` and `triggeredCount` increases. You need to reset or update the alert to trigger again.

**Q: Can I set alerts for all varieties/grades?**
A: Yes, leave `varietyId` and `gradeId` null/undefined. The alert will trigger for any variety/grade.

**Q: How do I reset a triggered alert?**
A: Update the alert with new prices or toggle it off and on again.

**Q: What's the difference between alert types?**
A: `"min"` = only lower threshold, `"max"` = only upper threshold, `"target"` = near target price, `"both"` = either threshold.

---

## 🐛 Troubleshooting

### Issue: "Duplicate alert" error
**Solution:** You already have an active alert for this combination. Either update it (PUT /:id) or delete it first.

### Issue: "Invalid price logic" error
**Solution:** Ensure upperPrice ≥ targetPrice and lowerPrice ≤ targetPrice.

### Issue: "Market not found" error
**Solution:** Verify the IDs are correct and exist in the database. Use the hierarchy endpoints to get valid IDs.

### Issue: Alert not triggering
**Solution:** Check that:
- Alert is active (`isActive: true`)
- Alert hasn't been triggered already (`notificationSent: false`)
- Current price matches the alert conditions
- Background job is running to check alerts

---

## 📝 Notes

- All prices are in INR (Indian Rupees)
- Prices should be per quintal (100kg) to match market price data
- Alerts are user-specific - users can only see/manage their own alerts
- Consider implementing rate limiting to prevent alert spam
- Store user's preference for notification channels (SMS, Email, Push)

---

For more information, see:
- [Master API Guide](MASTER_API_GUIDE.md)
- [React Native Auth Guide](REACT_NATIVE_AUTH_GUIDE.md)
- [Market Price API Guide](MASTER_API_GUIDE.md#market-price-queries)
