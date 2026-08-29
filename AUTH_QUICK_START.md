# 🔐 Authentication Setup - Quick Start

Quick reference guide for setting up mobile number authentication with Firebase and JWT.

## ✅ What's Implemented

- ✅ User model with mobile number and Firebase UID
- ✅ JWT authentication (Access + Refresh tokens)
- ✅ Firebase Auth integration for phone verification
- ✅ Signup/Login/Logout endpoints
- ✅ Token refresh mechanism
- ✅ Profile management
- ✅ Role-based access control (farmer, trader, admin)
- ✅ Protected routes middleware
- ✅ Postman collection updated
- ✅ Test script ready

## 🚀 Quick Setup (5 Steps)

### 1. Install Dependencies ✅ (Already Done)
```bash
npm install jsonwebtoken firebase-admin bcryptjs
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update:

```env
# JWT Secrets (Generate strong random strings)
JWT_ACCESS_SECRET=your_strong_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_different_strong_secret_here_min_32_chars

# Firebase Service Account (Get from Firebase Console)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

**Generate Strong Secrets:**
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

### 3. Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create new)
3. **Enable Authentication:**
   - Go to Authentication → Sign-in method
   - Enable "Phone" provider
4. **Get Service Account:**
   - Go to Project Settings (⚙️) → Service Accounts
   - Click "Generate New Private Key"
   - Copy the JSON content
   - Format as single line and paste in `.env` file

### 4. Start Server

```bash
npm start
# or
npm run dev
```

### 5. Test Authentication

```bash
node scripts/testAuthAPI.js
```

## 📱 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/signup` | Register new user | ❌ |
| POST | `/api/v1/auth/login` | Login user | ❌ |
| POST | `/api/v1/auth/refresh-token` | Get new access token | ❌ |
| GET | `/api/v1/auth/me` | Get user profile | ✅ |
| PUT | `/api/v1/auth/profile` | Update profile | ✅ |
| POST | `/api/v1/auth/verify-phone` | Verify phone number | ✅ |
| POST | `/api/v1/auth/logout` | Logout user | ✅ |

## 🧪 Testing with Postman

1. Open **Postman**
2. Import: `APMC Khetivadi API.postman_collection_latest.json`
3. Go to **Authentication API** folder
4. Try **Signup** request:
   ```json
   {
     "name": "Rajesh Patel",
     "mobileNumber": "9876543210",
     "role": "farmer"
   }
   ```
5. Copy `accessToken` from response
6. Set collection variable: `access_token` = `<your_token>`
7. Try protected endpoints (Get Profile, Update Profile, etc.)

## 🔑 Token Details

| Token Type | Expiry | Purpose |
|------------|--------|---------|
| **Access Token** | 15 days | API authorization |
| **Refresh Token** | 30 days | Generate new access tokens |

## 📱 React Native Integration

### Install Dependencies
```bash
npm install @react-native-firebase/app @react-native-firebase/auth
npm install @react-native-async-storage/async-storage axios
```

### Basic Flow
```javascript
// 1. Send OTP
const confirmation = await auth().signInWithPhoneNumber('+919876543210');

// 2. Verify OTP
const userCredential = await confirmation.confirm('123456');
const idToken = await userCredential.user.getIdToken();

// 3. Signup/Login
const response = await axios.post('/api/v1/auth/signup', {
  name: 'Rajesh Patel',
  mobileNumber: '9876543210',
  firebaseIdToken: idToken,
  role: 'farmer'
});

// 4. Store tokens
await AsyncStorage.setItem('accessToken', response.data.data.tokens.accessToken);
await AsyncStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
```

See [AUTHENTICATION_API_GUIDE.md](AUTHENTICATION_API_GUIDE.md) for complete React Native code.

## 🛡️ Security Features

- ✅ Firebase phone verification
- ✅ JWT token-based authentication
- ✅ Refresh token rotation
- ✅ Token expiration handling
- ✅ Role-based access control
- ✅ Secure password-less authentication
- ✅ Mobile number uniqueness validation

## 📖 Documentation

- **Complete Guide:** [AUTHENTICATION_API_GUIDE.md](AUTHENTICATION_API_GUIDE.md)
- **Postman Collection:** Open in Postman for detailed API examples
- **Test Script:** `scripts/testAuthAPI.js`

## 🔧 Protecting Your Routes

### Require Authentication
```javascript
const { verifyToken } = require('./middleware/auth');

router.get('/protected', verifyToken, (req, res) => {
  // req.user contains: { userId, mobileNumber, role, name }
  res.json({ message: `Hello ${req.user.name}` });
});
```

### Require Specific Role
```javascript
const { verifyToken, requireAdmin } = require('./middleware/auth');

router.post('/admin-only', verifyToken, requireAdmin, (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

### Optional Authentication
```javascript
const { optionalAuth } = require('./middleware/auth');

router.get('/public-or-private', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ message: `Welcome back ${req.user.name}` });
  } else {
    res.json({ message: 'Hello guest' });
  }
});
```

## 🐛 Troubleshooting

### Firebase Token Verification Failed
- ✅ Check `FIREBASE_SERVICE_ACCOUNT` in `.env`
- ✅ Ensure Firebase project matches mobile app
- ✅ Verify Phone authentication is enabled in Firebase

### JWT Error: "secretOrPrivateKey must have a value"
- ✅ Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env`
- ✅ Restart the server after updating `.env`

### "User already exists"
- ✅ Use `/auth/login` instead of `/auth/signup`
- ✅ Each mobile number can only register once

### Token Expired
- ✅ Use `/auth/refresh-token` endpoint with refresh token
- ✅ Implement auto-refresh in React Native app

## 📊 Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,              // User's name
  mobileNumber: String,      // 10-digit number (unique)
  firebaseUid: String,       // Firebase user UID
  role: String,              // farmer | trader | admin
  isActive: Boolean,         // Account status
  isPhoneVerified: Boolean,  // Phone verification status
  refreshToken: String,      // Current refresh token
  lastLogin: Date,           // Last login timestamp
  district: ObjectId,        // Reference to District
  market: ObjectId,          // Reference to Market
  preferredLanguage: String, // en | gu | hi
  createdAt: Date,
  updatedAt: Date
}
```

## ✅ Next Steps

1. **Production Setup:**
   - Generate strong JWT secrets
   - Set up Firebase project for production
   - Enable HTTPS
   - Configure CORS properly

2. **Mobile App:**
   - Integrate React Native Firebase
   - Implement authentication screens
   - Add token management
   - Handle token refresh

3. **Additional Features:**
   - Password recovery
   - Email verification
   - Social login
   - Two-factor authentication

## 📞 Support

- **Full Documentation:** [AUTHENTICATION_API_GUIDE.md](AUTHENTICATION_API_GUIDE.md)
- **API Reference:** Import Postman collection
- **Test API:** `node scripts/testAuthAPI.js`

---

**Status:** ✅ Ready for development and testing
**Last Updated:** February 16, 2026
