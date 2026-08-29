# 📱 React Native Authentication API Guide - APMC Khetivadi

Complete API reference guide for implementing phone authentication in your React Native app.

## 📋 Overview

This guide contains the Authentication API for the APMC Khetivadi backend. The authentication flow is **simple and streamlined**:

- **No separate signup process**
- **One endpoint for everything**: Users are automatically created during login if they don't exist
- Just collect mobile number (and optionally name for new users), verify OTP, and you're done!

Each API includes:
- What data to send (required/optional fields)
- What response you'll receive
- Steps to complete before calling the API
- Error handling

**Base URL:** `http://your-server-url.com/api/v1/auth`

---

## 🎯 Simplified Authentication Flow

### Single Login Flow (Auto-creates users)
```
1. User enters mobile number
2. Optionally enter name (recommended for better UX)
3. Generate OTP via Firebase in your app
4. User enters OTP received on phone
5. Verify OTP with Firebase in your app
6. Get Firebase ID Token after OTP verification
7. ✅ Call /login API with mobile, token, and name (optional)
8. Backend checks:
   → If user exists → Login and return tokens
   → If user doesn't exist → Auto-create and return tokens
9. Store JWT tokens received
10. Done! User is logged in
```

**Benefits of this approach:**
- ✅ **No signup screen needed** - Just one login screen
- ✅ **Simpler user experience** - Users don't need to know if they have an account
- ✅ **Saves Firebase OTP costs** - Only one OTP per authentication
- ✅ **Automatic account creation** - New users get accounts seamlessly
- ✅ **Fewer API calls** - Just one API instead of three

---

## 📚 API Endpoints Summary

| # | Endpoint | Method | Purpose | Protected |
|---|----------|--------|---------|-----------|
| 1 | `/login` | POST | Login user (auto-creates if new) | ❌ No |
| 2 | `/refresh-token` | POST | Refresh access token | ❌ No |
| 3 | `/me` | GET | Get user profile | ✅ Yes |
| 4 | `/profile` | PUT | Update user profile | ✅ Yes |
| 5 | `/logout` | POST | Logout user | ✅ Yes |

---

---

## � API 1: Check Mobile Number

**Purpose:** Check if a mobile number is already registered in the system.

**When to call:** BEFORE sending OTP (first step in signup/login flow)

**Endpoint:** `POST /api/v1/auth/check-mobile`

**Authentication:** Not required

### Request Body

```json
{
  "mobileNumber": "9876543210"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobileNumber` | String | ✅ Yes | 10-digit mobile number (without +91) |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "exists": false,
    "userType": "new",
    "message": "Mobile number is available for registration"
  }
}
```

OR if user exists:

```json
{
  "success": true,
  "data": {
    "exists": true,
    "userType": "existing",
    "message": "User already exists. Please login."
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `exists` | Boolean | `true` = user exists, `false` = new user |
| `userType` | String | `"existing"` or `"new"` |
| `message` | String | Human-readable message |

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Mobile number is required",
  "code": "VALIDATION_ERROR"
}
```

### What to do after this API:

**If exists = true (Signup flow):**
- Show alert: "This number is already registered"
- Redirect user to Login screen

**If exists = false (Login flow):**
- Show alert: "This number is not registered"
- Redirect user to Signup screen

**If exists = false (Signup flow):**
- Continue with signup
- Send OTP via Firebase

**If exists = true (Login flow):**
- Continue with login
- Send OTP via Firebase

---

## 📌 API 2: Signup

**Purpose:** Register a new user account

**When to call:** After Firebase OTP verification succeeds (only for new users)

**Prerequisites:**
1. ✅ Called `/check-mobile` and confirmed user doesn't exist
2. ✅ Sent OTP to user's phone via Firebase
3. ✅ User entered OTP and Firebase verified it
4. ✅ Got Firebase ID Token from verification

**Endpoint:** `POST /api/v1/auth/signup`

**Authentication:** Not required

### Request Body

```json
{
  "name": "Ramesh Patel",
  "mobileNumber": "9876543210",
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFkYzBmM...",
  "role": "farmer",
  "district": "Ahmedabad",
  "market": "Naroda APMC"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | User's full name (min 2 chars) |
| `mobileNumber` | String | ✅ Yes | 10-digit mobile number |
| `firebaseIdToken` | String | ✅ Yes | Firebase ID Token from OTP verification |
| `role` | String | ❌ Optional | User role: `"farmer"`, `"trader"`, or `"admin"` (default: `"farmer"`) |
| `district` | String | ❌ Optional | User's district name |
| `market` | String | ❌ Optional | User's market name |

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012",
      "name": "Ramesh Patel",
      "mobileNumber": "9876543210",
      "role": "farmer",
      "isPhoneVerified": true,
      "district": "Ahmedabad",
      "market": "Naroda APMC"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user._id` | String | Unique user ID |
| `user.name` | String | User's name |
| `user.mobileNumber` | String | User's mobile number |
| `user.role` | String | User's role |
| `user.isPhoneVerified` | Boolean | Phone verification status (always true after signup) |
| `tokens.accessToken` | String | JWT access token (valid for 15 days) |
| `tokens.refreshToken` | String | JWT refresh token (valid for 30 days) |

### Error Responses

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Name must be at least 2 characters long",
  "code": "VALIDATION_ERROR"
}
```

**400 Bad Request - User Already Exists:**
```json
{
  "success": false,
  "message": "User with this mobile number already exists",
  "code": "USER_EXISTS"
}
```

**401 Unauthorized - Invalid Firebase Token:**
```json
{
  "success": false,
  "message": "Invalid or expired Firebase token",
  "code": "INVALID_TOKEN"
}
```

### What to do after this API:

1. **Store tokens securely:**
   - Save `accessToken` in secure storage (AsyncStorage)
   - Save `refreshToken` in secure storage (AsyncStorage)

2. **Save user data:**
   - Store user object for app state management

3. **Navigate:**
   - Redirect to Home/Dashboard screen
   - Show success message

---

## 📌 API 3: Login

**Purpose:** Login an existing user

**When to call:** After Firebase OTP verification succeeds (only for existing users)

**Prerequisites:**
1. ✅ Called `/check-mobile` and confirmed user exists
2. ✅ Sent OTP to user's phone via Firebase
3. ✅ User entered OTP and Firebase verified it
4. ✅ Got Firebase ID Token from verification

**Endpoint:** `POST /api/v1/auth/login`

**Authentication:** Not required

### Request Body

```json
{
  "mobileNumber": "9876543210",
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFkYzBmM..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobileNumber` | String | ✅ Yes | 10-digit mobile number |
| `firebaseIdToken` | String | ✅ Yes | Firebase ID Token from OTP verification |

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012",
      "name": "Ramesh Patel",
      "mobileNumber": "9876543210",
      "role": "farmer",
      "isPhoneVerified": true,
      "district": "Ahmedabad",
      "market": "Naroda APMC"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

Response fields same as Signup API.

### Error Responses

**404 Not Found - User Doesn't Exist:**
```json
{
  "success": false,
  "message": "User not found with this mobile number",
  "code": "USER_NOT_FOUND"
}
```

**401 Unauthorized - Invalid Firebase Token:**
```json
{
  "success": false,
  "message": "Invalid or expired Firebase token",
  "code": "INVALID_TOKEN"
}
```

**403 Forbidden - Phone Not Verified:**
```json
{
  "success": false,
  "message": "Phone number is not verified",
  "code": "PHONE_NOT_VERIFIED"
}
```

### What to do after this API:

Same as Signup API - store tokens and navigate to Home screen.

---

## 📌 API 4: Refresh Token

**Purpose:** Get a new access token when the current one expires

**When to call:** When you receive a 401 error with code `"TOKEN_EXPIRED"`

**Endpoint:** `POST /api/v1/auth/refresh-token`

**Authentication:** Not required (but needs refresh token)

### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | String | ✅ Yes | The refresh token received during login/signup |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | String | New JWT access token (valid for 15 days) |

### Error Responses

**401 Unauthorized - Invalid Refresh Token:**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token",
  "code": "INVALID_REFRESH_TOKEN"
}
```

**404 Not Found - User Not Found:**
```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

### What to do after this API:

1. **If successful:**
   - Replace old access token with new one in storage
   - Retry the failed API call with new token

2. **If failed:**
   - Clear all tokens from storage
   - Redirect user to Login screen
   - Show message: "Session expired. Please login again."

### Auto Token Refresh Implementation:

You should automatically call this API when any protected API returns:
```json
{
  "success": false,
  "code": "TOKEN_EXPIRED"
}
```

**Recommended approach:**
- Use axios/fetch interceptor
- Catch 401 errors with `TOKEN_EXPIRED` code
- Call refresh-token API
- Retry original request with new token
- If refresh fails, logout user

---

## 📌 API 5: Get Profile

**Purpose:** Get current user's profile information

**When to call:** After login, or anytime you need user data

**Endpoint:** `GET /api/v1/auth/me`

**Authentication:** ✅ Required (Bearer Token)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body

No body required (GET request)

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012",
      "name": "Ramesh Patel",
      "mobileNumber": "9876543210",
      "role": "farmer",
      "isPhoneVerified": true,
      "district": "Ahmedabad",
      "market": "Naroda APMC",
      "preferredLanguage": "gu",
      "createdAt": "2026-02-10T10:30:00.000Z"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user._id` | String | Unique user ID |
| `user.name` | String | User's name |
| `user.mobileNumber` | String | User's mobile number |
| `user.role` | String | User role (`"farmer"`, `"trader"`, or `"admin"`) |
| `user.isPhoneVerified` | Boolean | Phone verification status |
| `user.district` | String | User's district (if provided) |
| `user.market` | String | User's market (if provided) |
| `user.preferredLanguage` | String | Preferred language code (`"en"` or `"gu"`) |
| `user.createdAt` | String | Account creation date (ISO format) |

### Error Responses

**401 Unauthorized - No Token:**
```json
{
  "success": false,
  "message": "Access token is required",
  "code": "NO_TOKEN"
}
```

**401 Unauthorized - Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

**401 Unauthorized - Token Expired:**
```json
{
  "success": false,
  "message": "Access token has expired",
  "code": "TOKEN_EXPIRED"
}
```

### What to do after this API:

- Update user state in your app
- Display user information in profile screen
- Use district/market data for filtering market prices

---

## 📌 API 6: Update Profile

**Purpose:** Update user's profile information

**When to call:** When user wants to change their profile details

**Endpoint:** `PUT /api/v1/auth/profile`

**Authentication:** ✅ Required (Bearer Token)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body

```json
{
  "name": "Ramesh K. Patel",
  "district": "Gandhinagar",
  "market": "Sector 11 APMC",
  "preferredLanguage": "gu"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ❌ Optional | User's full name (min 2 chars) |
| `district` | String | ❌ Optional | User's district name |
| `market` | String | ❌ Optional | User's market name |
| `preferredLanguage` | String | ❌ Optional | Language code: `"en"` (English) or `"gu"` (Gujarati) |

**Note:** You can update any combination of fields. Only send fields you want to update.

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6789012",
      "name": "Ramesh K. Patel",
      "mobileNumber": "9876543210",
      "role": "farmer",
      "isPhoneVerified": true,
      "district": "Gandhinagar",
      "market": "Sector 11 APMC",
      "preferredLanguage": "gu",
      "createdAt": "2026-02-10T10:30:00.000Z"
    }
  }
}
```

### Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Name must be at least 2 characters long",
  "code": "VALIDATION_ERROR"
}
```

### What to do after this API:

- Update user state in your app
- Show success message
- Refresh profile screen with new data

---

## 📌 API 7: Logout

**Purpose:** Logout user and invalidate refresh token

**When to call:** When user clicks logout button

**Endpoint:** `POST /api/v1/auth/logout`

**Authentication:** ✅ Required (Bearer Token)

### Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body

No body required

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

### What to do after this API:

1. Clear all tokens from storage (AsyncStorage)
2. Clear user data from app state
3. Clear any cached data
4. Navigate to Login screen
5. Show success message

## 🔐 Token Management Guide

### Token Storage
You need to securely store two types of tokens received from Signup/Login APIs:

**Access Token:**
- Validity: 15 days
- Usage: Send with every protected API call
- Header format: `Authorization: Bearer <accessToken>`

**Refresh Token:**
- Validity: 30 days
- Usage: Get new access token when it expires
- Only used with `/refresh-token` API

### Recommended Storage Method
Use AsyncStorage or SecureStore to save tokens on device:

**Save after Login/Signup:**
```
Save tokens:
- Key: "accessToken" → Value: <accessToken>
- Key: "refreshToken" → Value: <refreshToken>
```

**Retrieve for API calls:**
```
Get "accessToken" from storage
Add to API headers: Authorization: Bearer <token>
```

**Clear on Logout:**
```
Remove both "accessToken" and "refreshToken" from storage
```

### Token Refresh Flow (Important!)

When any protected API returns `401` error with code `"TOKEN_EXPIRED"`:

1. Get `refreshToken` from storage
2. Call `/refresh-token` API
3. **If successful:**
   - Save new `accessToken`
   - Retry the original failed API with new token
4. **If failed:**
   - Clear all tokens
   - Redirect to Login screen
   - Show: "Session expired. Please login again."

**Tip:** Implement this using axios/fetch interceptor to handle automatically.

---

## 🛡️ Protected API Calls

All protected APIs require access token in header:

**Required Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Protected APIs:**
- `GET /api/v1/auth/me` - Get profile
- `PUT /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/logout` - Logout
- All market price APIs
- All analytics APIs

**Example Request:**
```
GET /api/v1/auth/me
Headers:
  Authorization: Bearer <your-access-token>
```

---

## ❌ Error Handling Guide

### Common Error Codes

| Code | HTTP Status | Meaning | Action |
|------|-------------|---------|--------|
| `VALIDATION_ERROR` | 400 | Invalid input data | Show error message to user |
| `USER_EXISTS` | 400 | Mobile already registered | Redirect to Login |
| `USER_NOT_FOUND` | 404 | Mobile not registered | Redirect to Signup |
| `INVALID_TOKEN` | 401 | Invalid Firebase/JWT token | Ask user to retry |
| `TOKEN_EXPIRED` | 401 | Access token expired | Call refresh-token API |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token expired | Logout and redirect to Login |
| `NO_TOKEN` | 401 | Missing authorization header | Redirect to Login |
| `PHONE_NOT_VERIFIED` | 403 | Phone verification failed | Ask user to re-verify |

### Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "message": "Human readable error message",
  "code": "ERROR_CODE"
}
```

### Handling Errors in Your App

**Network Errors:**
- Check internet connection
- Show: "Please check your internet connection"
- Provide retry button

**Validation Errors (400):**
- Display error message from API
- Highlight incorrect field
- Example: "Name must be at least 2 characters long"

**Authentication Errors (401):**
- `TOKEN_EXPIRED` → Auto refresh token
- `INVALID_TOKEN` → Redirect to Login
- `INVALID_REFRESH_TOKEN` → Logout and redirect to Login

**Not Found Errors (404):**
- `USER_NOT_FOUND` → Redirect to Signup
- Show appropriate message

---

## 🎯 Implementation Prerequisites

### What You Need Before Integration:

**1. Firebase Setup:**
- Create Firebase project at console.firebase.google.com
- Enable Phone Authentication
- Download `google-services.json` (Android)
- Download `GoogleService-Info.plist` (iOS)
- Add SHA-1 certificate for Android
- Add test phone numbers for development

**2. React Native Dependencies:**
```bash
npm install @react-native-firebase/app @react-native-firebase/auth
npm install @react-native-async-storage/async-storage
npm install axios
```

**3. Backend Server:**
- Get backend URL from your server team
- Example: `https://api.yourdomain.com` or `http://your-ip:5000`
- Update base URL in your API client

**4. Understanding Required:**
- How to make HTTP requests (axios/fetch)
- How to store data locally (AsyncStorage)
- How to handle async operations
- Navigation between screens

---

## 🎯 Step-by-Step Integration Flow

### Step 1: User Enters Details
**In your Signup screen:**
- Show input field for Name
- Show input field for Mobile Number
- Show "Send OTP" button

**In your Login screen:**
- Show input field for Mobile Number
- Show "Send OTP" button

### Step 2: Call Check Mobile API
**Before sending OTP:**
```
Request: POST /api/v1/auth/check-mobile
Body: { mobileNumber: "9876543210" }
```

**Handle Response:**
- If `exists: true` in Signup → Alert user + Navigate to Login
- If `exists: false` in Login → Alert user + Navigate to Signup
- Otherwise → Continue to Step 3

### Step 3: Send OTP via Firebase
**In your React Native app:**
- Use Firebase Phone Auth: `auth().signInWithPhoneNumber('+919876543210')`
- Firebase will send OTP to user's phone
- Store confirmation object for later verification

### Step 4: User Enters OTP
- Show OTP input field (6 digits)
- Show "Verify" button
- Optionally show "Resend OTP" button (cooldown: 30 seconds)

### Step 5: Verify OTP with Firebase
**In your React Native app:**
- Call `confirmation.confirm(otpCode)`
- Get user credential from Firebase
- Extract ID Token: `credential.user.getIdToken()`
- Store this ID Token - you'll send it to backend

### Step 6: Call Signup or Login API
**For Signup:**
```
Request: POST /api/v1/auth/signup
Body: {
  name: "Ramesh Patel",
  mobileNumber: "9876543210",
  firebaseIdToken: "<token-from-step-5>",
  role: "farmer"  // optional
}
```

**For Login:**
```
Request: POST /api/v1/auth/login
Body: {
  mobileNumber: "9876543210",
  firebaseIdToken: "<token-from-step-5>"
}
```

### Step 7: Store Tokens
**After successful signup/login:**
- Extract `accessToken` from response
- Extract `refreshToken` from response
- Save both in AsyncStorage/SecureStore
- Save user object in app state

### Step 8: Navigate to Home
- Close login/signup screens
- Navigate to main app screen (Home/Dashboard)
- Show success message (optional)

---

## 🧪 Testing Guide

### Test Case 1: New User Signup

**Steps:**
1. Open Signup screen
2. Enter name: "Ramesh Patel"
3. Enter mobile: "9876543210"
4. Click "Send OTP"
5. Check mobile API called → Response: `exists: false`
6. Check Firebase sends OTP to phone
7. Enter OTP received
8. Click "Verify & Signup"
9. Backend creates account
10. Tokens received and stored
11. Navigated to Home screen

**Expected Result:**
- ✅ User account created in database
- ✅ Tokens stored in device storage
- ✅ User logged in successfully

### Test Case 2: Existing User Tries Signup

**Steps:**
1. Open Signup screen
2. Enter mobile number that's already registered
3. Click "Send OTP"

**Expected Result:**
- ✅ Check mobile API returns `exists: true`
- ✅ Alert shown: "Account already exists"
- ✅ No OTP sent (Firebase cost saved!)
- ✅ User redirected to Login screen

### Test Case 3: Existing User Login

**Steps:**
1. Open Login screen
2. Enter registered mobile number
3. Click "Send OTP"
4. Check mobile API called → Response: `exists: true`
5. Firebase sends OTP
6. Enter OTP
7. Click "Verify & Login"
8. Backend verifies and logs in
9. Tokens received

**Expected Result:**
- ✅ User logged in successfully
- ✅ Navigated to Home screen

### Test Case 4: New User Tries Login

**Steps:**
1. Open Login screen
2. Enter mobile number that's not registered
3. Click "Send OTP"

**Expected Result:**
- ✅ Check mobile API returns `exists: false`
- ✅ Alert shown: "Account not found"
- ✅ No OTP sent (Firebase cost saved!)
- ✅ User redirected to Signup screen

### Test Case 5: Token Refresh

**Steps:**
1. Login successfully
2. Wait until access token expires (or manually expire it)
3. Call any protected API (e.g., GET /auth/me)
4. API returns 401 with code `TOKEN_EXPIRED`
5. Auto call refresh-token API
6. Get new access token
7. Retry original API with new token

**Expected Result:**
- ✅ Access token refreshed automatically
- ✅ Original API call succeeds
- ✅ User doesn't notice anything

### Test Case 6: Refresh Token Expired

**Steps:**
1. Login successfully
2. Manually expire both tokens
3. Call any protected API
4. Token refresh fails

**Expected Result:**
- ✅ All tokens cleared from storage
- ✅ User redirected to Login screen
- ✅ Message: "Session expired. Please login again."

### Test Case 7: Logout

**Steps:**
1. Login successfully
2. Click Logout button
3. Logout API called
4. Tokens cleared from device

**Expected Result:**
- ✅ Tokens removed from storage
- ✅ User redirected to Login screen
- ✅ Cannot access protected APIs anymore

---

## 🐛 Common Issues & Solutions

### Issue 1: Firebase OTP not received
**Possible Causes:**
- Phone authentication not enabled in Firebase Console
- Wrong phone number format (must include +91)
- Testing on emulator without test number configured
- SMS quota exceeded

**Solution:**
- Go to Firebase Console → Authentication → Sign-in method
- Enable "Phone" authentication
- Add test phone numbers for development: Settings → Test phone numbers
- Format: +919876543210 (with country code)
- For Android emulator: Configure test number with fixed OTP (e.g., 123456)

### Issue 2: "Invalid Firebase token" error
**Possible Causes:**
- Firebase ID Token expired (tokens expire after 1 hour)
- Wrong token sent to backend
- Time sync issue between device and server

**Solution:**
- Always get fresh ID token after OTP verification: `user.getIdToken()`
- Send token immediately to backend (don't store it)
- If token expired, ask user to verify OTP again

### Issue 3: "Network Error" or Cannot connect to backend
**Possible Causes:**
- Wrong API URL
- Backend server not running
- Firewall blocking connection
- Using localhost on physical device

**Solution:**
- **Android Emulator:** Use `http://10.0.2.2:5000` instead of localhost
- **iOS Simulator:** Use `http://localhost:5000` or `http://127.0.0.1:5000`
- **Physical Device:** Use your computer's local IP (e.g., `http://192.168.1.100:5000`)
- **Production:** Use HTTPS domain (e.g., `https://api.yourdomain.com`)
- Check backend server is running: `npm start` or `npm run dev`
- Test backend URL in browser or Postman first

### Issue 4: Token expired errors immediately
**Possible Causes:**
- Clock skew between device and server
- Wrong token expiry configuration in backend
- Token being corrupted during storage

**Solution:**
- Sync device time with internet time
- Check backend JWT expiry configuration (should be 15 days for access token)
- Store tokens as plain strings (no modifications)
- Test token validity: Decode JWT at jwt.io

### Issue 5: "User already exists" during signup
**Cause:**
- Mobile number already registered in database

**Solution:**
- This is actually correct behavior!
- Check mobile API should have prevented this
- User should use Login instead
- If needed: Delete user from MongoDB and try again (only for testing)

### Issue 6: Tokens not persisting after app restart
**Possible Causes:**
- Not using AsyncStorage correctly
- Clear data during development
- Storage permissions issue

**Solution:**
- Use `@react-native-async-storage/async-storage`
- Always await AsyncStorage operations: `await AsyncStorage.setItem()`
- Check storage: `await AsyncStorage.getAllKeys()`
- For sensitive data: Consider using `react-native-encrypted-storage`

---

## 📞 Testing APIs Using Postman

You can test all APIs using Postman before implementing in React Native.

### Import Collection
1. Download `APMC_Khetivadi_API.postman_collection.json`
2. Open Postman
3. Click Import
4. Select the JSON file
5. Collection will appear in sidebar

### Test Authentication Flow

**Step 1: Check Mobile (New User)**
```
POST {{baseUrl}}/auth/check-mobile
Body: { "mobileNumber": "9876543210" }
Expected: { exists: false, userType: "new" }
```

**Step 2: Get Firebase Token**
- Use Firebase Console or your React Native app
- Verify OTP and get ID Token
- Copy the token for next step

**Step 3: Signup**
```
POST {{baseUrl}}/auth/signup
Body: {
  "name": "Test User",
  "mobileNumber": "9876543210",
  "firebaseIdToken": "<paste-token-here>",
  "role": "farmer"
}
```
- Copy `accessToken` and `refreshToken` from response

**Step 4: Get Profile**
```
GET {{baseUrl}}/auth/me
Headers: Authorization: Bearer <paste-access-token>
```

**Step 5: Update Profile**
```
PUT {{baseUrl}}/auth/profile
Headers: Authorization: Bearer <paste-access-token>
Body: {
  "district": "Ahmedabad",
  "market": "Naroda APMC"
}
```

**Step 6: Logout**
```
POST {{baseUrl}}/auth/logout
Headers: Authorization: Bearer <paste-access-token>
```

---

## 🔒 Security Best Practices

### DO's ✅

1. **Store tokens securely:**
   - Use AsyncStorage or SecureStore
   - Never log tokens in production
   - Clear tokens on logout

2. **Use HTTPS in production:**
   - Never use HTTP for production APIs
   - Enforce SSL/TLS
   - Use valid SSL certificates

3. **Handle token expiry:**
   - Implement auto token refresh
   - Clear expired tokens
   - Show appropriate error messages

4. **Validate user input:**
   - Check mobile number format (10 digits)
   - Validate OTP (6 digits)
   - Validate name (min 2 characters)

5. **Handle errors gracefully:**
   - Show user-friendly messages
   - Don't expose technical details
   - Log errors for debugging

6. **Test thoroughly:**
   - Test on Android and iOS
   - Test on emulator and physical devices
   - Test network error scenarios
   - Test token expiry scenarios

### DON'Ts ❌

1. **Never store Firebase ID Token:**
   - Only use it once for signup/login
   - Don't store it permanently
   - Get fresh token for each signup/login

2. **Don't hardcode API URLs:**
   - Use environment variables
   - Different URLs for dev/staging/production

3. **Don't skip error handling:**
   - Always handle network errors
   - Always handle invalid responses
   - Always validate responses

4. **Don't send OTP without checking:**
   - Always call check-mobile first
   - Saves Firebase costs
   - Better user experience

5. **Don't ignore token refresh:**
   - Implement auto refresh
   - Handle refresh failures
   - Clear tokens on refresh failure

---

## 📝 Pre-Launch Checklist

Before deploying your app:

**Firebase:**
- [ ] Phone authentication enabled
- [ ] Test phone numbers removed (production)
- [ ] Firebase project in production mode
- [ ] API keys secured
- [ ] Usage limits configured

**Backend API:**
- [ ] Backend deployed to production server
- [ ] HTTPS enabled (SSL certificate installed)
- [ ] Environment variables configured
- [ ] JWT secrets are strong and random
- [ ] Firebase service account configured
- [ ] Database backups enabled
- [ ] API tested with Postman

**React Native App:**
- [ ] API URL changed to production
- [ ] Firebase config updated (production keys)
- [ ] Token storage implemented
- [ ] Token refresh implemented
- [ ] Error handling implemented
- [ ] Loading states for all API calls
- [ ] User-friendly error messages
- [ ] Logout functionality working
- [ ] No console.logs with sensitive data
- [ ] Tested on Android physical device
- [ ] Tested on iOS physical device

**Testing:**
- [ ] New user signup tested
- [ ] Existing user login tested
- [ ] Check mobile optimization working
- [ ] OTP verification tested
- [ ] Token refresh tested
- [ ] Logout tested
- [ ] Network error handling tested
- [ ] Session expiry tested

---

## 📚 Additional Resources

### Backend Documentation
- **Authentication API Guide:** `AUTHENTICATION_API_GUIDE.md` - Complete backend API documentation
- **Quick Reference:** `AUTH_QUICK_START.md` - Quick commands and tips
- **Postman Collection:** `APMC_Khetivadi_API.postman_collection.json` - Import for testing

### Testing Commands
```bash
# Test backend authentication APIs
npm run test:auth

# Check Firebase configuration
npm run check:firebase

# Start backend server
npm start
```

### Useful Links
- **Firebase Console:** https://console.firebase.google.com
- **JWT Decoder:** https://jwt.io (decode and verify JWT tokens)
- **React Native Firebase:** https://rnfirebase.io
- **AsyncStorage:** https://react-native-async-storage.github.io/async-storage/

---

## 💡 Quick Reference

### Base URL
```
Production: https://api.yourdomain.com/api/v1/auth
Development: http://your-computer-ip:5000/api/v1/auth
```

### Required Headers for Protected APIs
```
Authorization: Bearer <access-token>
Content-Type: application/json
```

### Token Expiry
- Access Token: 15 days
- Refresh Token: 30 days

### Phone Number Format
- Database storage: `"9876543210"` (10 digits, no +91)
- Firebase OTP: `"+919876543210"` (with +91 country code)

### User Roles
- `"farmer"` - Default role for farmers
- `"trader"` - For traders
- `"admin"` - For administrators

### Language Codes
- `"en"` - English
- `"gu"` - Gujarati (ગુજરાતી)

---

## 📞 Support & Help

**If you're stuck:**

1. **Check backend is running:**
   ```bash
   # Test backend health
   curl http://localhost:5000/api/v1/auth/health
   ```

2. **Test API with Postman first:**
   - Import collection
   - Test each endpoint
   - Check request/response

3. **Check Firebase setup:**
   ```bash
   npm run check:firebase
   ```

4. **Review error logs:**
   - Check backend console for errors
   - Check React Native debugger console
   - Check network tab in debugger

5. **Common Commands:**
   ```bash
   # Start backend
   npm start

   # Test authentication
   npm run test:auth

   # Check logs
   npm run logs
   ```

---

**Last Updated:** February 16, 2026  
**Version:** 2.0.0  
**Backend API:** APMC Khetivadi v1  
**Documentation Type:** API Reference for React Native Developers

---

## 🎉 Summary

This guide provided you with:

✅ Complete list of 7 Authentication APIs  
✅ Required vs Optional fields for each API  
✅ Request/Response formats for all APIs  
✅ Error codes and handling  
✅ Token management guide  
✅ Step-by-step integration flow  
✅ Testing guide with test cases  
✅ Common issues and solutions  
✅ Security best practices  
✅ Pre-launch checklist  

**You now have everything needed to integrate authentication in your React Native app!**

Need more help? Check the backend documentation: `AUTHENTICATION_API_GUIDE.md`
