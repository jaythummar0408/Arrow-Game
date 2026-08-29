# Price Alert Notification System - Complete Guide

## 📋 Overview

The Price Alert Notification System automatically checks price updates from Data.gov API and sends push notifications to farmers when their target prices are reached.

## 🏗️ Architecture

### Components
1. **Cron Job** - Runs every hour to check prices
2. **Data.gov API** - Source of current market prices
3. **Firebase Cloud Messaging** - Push notification service
4. **Alert Model** - Stores user price alerts
5. **Notification Service** - Handles FCM integration

## ⏰ Cron Schedule

- **Frequency**: Every hour at minute 0
- **Cron Expression**: `0 * * * *`
- **Auto-starts**: When server starts
- **Manual Run**: `npm run check:alerts`

## 🔄 Workflow

### 1. Data Collection
```
Every hour:
├── Fetch today's prices from Data.gov API
├── Filter for Gujarat state
├── Get ~300 records with district/market/commodity
└── Each record contains: district, market, commodity, modal_price
```

### 2. Alert Processing (Optimized)
```
For each price record:
├── Match district name → Get district ID
├── Match market name → Get market ID
├── Match commodity name → Get commodity ID
├── Find all ACTIVE alerts for this combination
├── Group by district → market → commodity
└── Check each alert condition
```

### 3. Notification Flow
```
For each triggered alert:
├── Check if user has FCM token
├── Build notification message
├── Send via Firebase Cloud Messaging
├── Delete alert from database
└── Log result
```

## 📊 Alert Conditions

### Direction Types
- **"up"**: Notify when `current price >= target price`
- **"down"**: Notify when `current price <= target price`

### Examples
```javascript
// Alert 1: Farmer wants notification when price goes UP
{
  targetPrice: 3500,
  direction: "up",
  currentPrice: 3600 → ✅ TRIGGERED (3600 >= 3500)
}

// Alert 2: Farmer wants notification when price goes DOWN
{
  targetPrice: 3000,
  direction: "down",
  currentPrice: 2900 → ✅ TRIGGERED (2900 <= 3000)
}
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install node-cron
```

### 2. Configure Firebase
```javascript
// config/firebase.js should have Firebase Admin SDK initialized
// Required for sending push notifications
```

### 3. Update User FCM Token

**When user logs in (React Native/Flutter):**
```javascript
// Get FCM token from device
const fcmToken = await messaging().getToken();

// Send to API
PUT /api/v1/auth/fcm-token
{
  "fcmToken": "user_device_fcm_token"
}
```

### 4. Start Server
```bash
npm start
# Cron job will auto-start and run every hour
```

## 📱 Notification Format

### Android/iOS Notification
```json
{
  "notification": {
    "title": "Price Alert: Wheat",
    "body": "Junagadh Market, Junagadh\nPrice reached ₹3600 (Target: ₹3500)\nPrice went above your target!"
  },
  "data": {
    "type": "PRICE_ALERT",
    "district": "Junagadh",
    "market": "Junagadh Market",
    "commodity": "Wheat",
    "targetPrice": "3500",
    "currentPrice": "3600",
    "direction": "up"
  }
}
```

## 📂 File Structure

```
Project/
├── scripts/
│   └── checkPriceAlertsCron.js    # Main cron job logic
├── utils/
│   └── firebaseNotification.js    # FCM notification service
├── controllers/
│   └── authController.js          # FCM token update endpoint
├── models/
│   ├── priceAlert.model.js        # Alert schema
│   └── user.model.js              # User with fcmToken field
├── routes/
│   └── authRoutes.js              # FCM token route
└── server.js                       # Cron job initialization
```

## 🛠️ API Endpoints

### Update FCM Token
```http
PUT /api/v1/auth/fcm-token
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "fcmToken": "device_fcm_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token updated successfully",
  "data": {
    "fcmTokenUpdated": true
  }
}
```

### Create Price Alert (with FCM)
```http
POST /api/v1/alerts
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "districtId": "65a1234567890abcdef12345",
  "marketId": "65a1234567890abcdef12346",
  "commodityId": "65a1234567890abcdef12347",
  "targetPrice": 3500,
  "direction": "up",
  "isActive": true
}
```

## 🧪 Testing

### Manual Test
```bash
# Run cron job manually
npm run check:alerts

# Should output:
# 📡 Fetching today's prices...
# ✅ Fetched 300 price records
# 🔍 Found 5 active alerts for Wheat in Junagadh
# ✅ Notification sent to user 9876543210
# 🗑️ Deleted 3 triggered alerts
```

### Test Notification
```bash
# Create test alert
POST /api/v1/alerts
{
  "districtId": "...",
  "marketId": "...",
  "commodityId": "...",
  "targetPrice": 3000,  # Set low price for testing
  "direction": "up",
  "isActive": true
}

# Wait for next cron run (or run manually)
npm run check:alerts

# Check if notification received on device
```

## 📊 Performance Optimization

### Grouping Strategy
Instead of checking each alert individually, we group by:
1. **District** - All alerts in same district
2. **Market** - All alerts in same market
3. **Commodity** - All alerts for same commodity

This reduces database queries significantly:
- ❌ Old: 1000 alerts = 1000 DB queries
- ✅ New: 1000 alerts = ~50 DB queries (grouped)

### Efficiency Example
```
Scenario: 300 price records, 1000 active alerts

Without Grouping:
├── 1000 individual queries
├── Time: ~30 seconds
└── Load: High

With Grouping:
├── ~50 grouped queries
├── Time: ~5 seconds
└── Load: Low
```

## 🔍 Monitoring & Logs

### Console Output
```
⏰ Initializing cron jobs...
✅ Cron jobs initialized - Price alerts will check every hour

🚀 Starting price alert check...
⏰ Time: 17/02/2026, 10:00:00

📡 Fetching today's prices from Data.gov API...
✅ Fetched 300 price records
📊 Processing 300 records from 12 districts

🔍 Found 5 active alerts for Wheat in Junagadh
✅ Notification sent to user 9876543210 for Wheat
✅ Notification sent to user 9876543211 for Wheat
🗑️ Deleted 5 triggered alerts

✅ Price alert check completed!
📈 Total alerts checked: 25
📲 Notifications sent: 5
⏰ Time: 17/02/2026, 10:00:45
```

## ⚠️ Error Handling

### User has no FCM Token
```
⚠️ User 65a123... has no FCM token
→ Alert is deleted but no notification sent
→ User should update FCM token via /api/v1/auth/fcm-token
```

### District/Market/Commodity Not Found
```
⚠️ District not found: Junagadh
→ Skip this price record
→ Check if district name matches DB
```

### Firebase Send Failed
```
❌ Failed to send notification to user 9876543210
→ Alert is still deleted (one-time use)
→ Check Firebase configuration
```

## 🔐 Security

### Authentication Required
- All alert endpoints require JWT Bearer token
- FCM token update requires authentication
- Alerts are user-specific (can't access other user's alerts)

### Data Privacy
- FCM tokens stored securely
- Notifications sent to individual devices only
- No alert data shared between users

## 📱 Mobile App Integration

### React Native Example
```javascript
import messaging from '@react-native-firebase/messaging';

// 1. Request notification permission
const authStatus = await messaging().requestPermission();

// 2. Get FCM token
const fcmToken = await messaging().getToken();

// 3. Send to backend after login
const response = await fetch('https://api.example.com/api/v1/auth/fcm-token', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ fcmToken })
});

// 4. Listen for notifications
messaging().onMessage(async remoteMessage => {
  if (remoteMessage.data.type === 'PRICE_ALERT') {
    // Show in-app notification
    const { commodity, currentPrice, targetPrice } = remoteMessage.data;
    Alert.alert(
      `Price Alert: ${commodity}`,
      `Current: ₹${currentPrice}, Target: ₹${targetPrice}`
    );
  }
});

// 5. Handle background notifications
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification:', remoteMessage);
});
```

## 🎯 Best Practices

### For Farmers
1. Update FCM token immediately after login
2. Set realistic target prices
3. Don't create duplicate alerts
4. Maximum 2 alerts per market-commodity (up + down)
5. Keep app updated to receive notifications

### For Developers
1. Monitor cron job logs regularly
2. Check Firebase quota limits
3. Validate district/market/commodity names match DB
4. Test notifications on real devices
5. Handle FCM token expiration/refresh

## 🐛 Troubleshooting

### Notifications Not Received

**Check 1: FCM Token**
```bash
# Query user's FCM token in DB
db.users.findOne({ mobile: "9876543210" }, { fcmToken: 1 })
# Should have valid token
```

**Check 2: Alert Active Status**
```bash
# Check if alert is active
db.pricealerts.find({ user: userId, isActive: true })
# Should return alerts
```

**Check 3: Cron Job Running**
```bash
# Check server logs
# Should see: "✅ Cron jobs initialized"
```

**Check 4: Firebase Configuration**
```bash
# Check if Firebase Admin SDK is initialized
# Should have serviceAccountKey.json
```

### Alert Not Triggering

**Check 1: Price Condition**
```
Alert: targetPrice=3500, direction="up"
Current Price: 3400
Result: ❌ Not triggered (3400 < 3500)

Alert: targetPrice=3500, direction="up"
Current Price: 3600
Result: ✅ Triggered (3600 >= 3500)
```

**Check 2: Data.gov API**
```bash
# Test API manually
curl "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=YOUR_KEY&format=json&limit=10&filters[state.keyword]=Gujarat"
```

## 📝 Notes

- Cron runs every hour at :00 minutes (9:00, 10:00, 11:00, etc.)
- Alerts are ONE-TIME use (deleted after notification)
- Users must recreate alerts for continuous monitoring
- FCM tokens should be kept up-to-date
- Firebase has daily quota limits (check Firebase console)

## 🚀 Future Enhancements

1. **SMS Fallback** - Send SMS if push notification fails
2. **Notification Preferences** - Allow users to set quiet hours
3. **Multiple Alerts** - Support for alert history and analytics
4. **Batch Notifications** - Send multiple alerts in one notification
5. **Price Trends** - Show price trend graphs in notification
6. **Regional Language** - Notifications in Gujarati/Hindi

## 📞 Support

For issues or questions:
- Check logs: `npm run check:alerts`
- Test FCM token endpoint
- Verify Firebase configuration
- Check Data.gov API status

---

**Last Updated**: February 17, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
