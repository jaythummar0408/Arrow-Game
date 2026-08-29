# 📱 React Native Authentication API Guide - APMC Khetivadi

Complete API reference guide for implementing phone authentication in your React Native app.

## 📋 Overview

This guide contains the Authentication API for the APMC Khetivadi backend. The authentication flow is **simple and streamlined**:

- **No separate signup process**
- **One endpoint for everything**: Users are automatically created during login if they don't exist
- Just collect mobile number, verify OTP, and you're done! (Users can add their name later via profile update)

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
2. Generate OTP via Firebase in your app
3. User enters OTP received on phone
4. Verify OTP with Firebase in your app
5. Get Firebase ID Token after OTP verification
6. ✅ Call /login API with mobile and token
7. Backend checks:
   → If user exists → Login and return tokens
   → If user doesn't exist → Auto-create with default name and return tokens
8. Store JWT tokens received
9. Done! User is logged in
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

## 📌 API 1: Login (Auto-creates user if new)

**Purpose:** Login user with mobile number and Firebase OTP token. Automatically creates user account if it doesn't exist.

**When to call:** After Firebase OTP verification succeeds

**Prerequisites:**
1. ✅ Sent OTP to user's phone via Firebase
2. ✅ User entered OTP and Firebase verified it
3. ✅ Got Firebase ID Token from Firebase OTP verification

**Endpoint:** `POST /api/v1/auth/login`

**Authentication:** Not required

### Request Body

```json
{
  "mobileNumber": "9876543210",
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFkYzBmM...",
  "role": "farmer"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobileNumber` | String | ✅ Yes | 10-digit mobile number (without +91) |
| `firebaseIdToken` | String | ✅ Yes | Firebase ID Token from OTP verification |
| `role` | String | ❌ Optional | User role: `"farmer"`, `"trader"`, or `"admin"` (default: `"farmer"`) |

**Note:** 
- If the mobile number already exists in the database, the user will be logged in
- If the mobile number is new, a user account will be automatically created with default name: `User_XXXX` (last 4 digits of mobile)
- User can update their name later using the **Update Profile API** (`PUT /profile`)

### Success Response (200 OK)

**For existing user:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "isNewUser": false,
    "user": {
      "id": "65a1b2c3d4e5f6789012",
      "name": "Ramesh Patel",
      "mobileNumber": "9876543210",
      "role": "farmer",
      "isPhoneVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "accessTokenExpiresIn": "15d",
      "refreshTokenExpiresIn": "30d"
    }
  }
}
```

**For new user (auto-created):**
```json
{
  "success": true,
  "message": "Account created and logged in successfully",
  "data": {
    "isNewUser": true,
    "user": {
      "id": "65a1b2c3d4e5f6789012",
      "name": "User_3210",
      "mobileNumber": "9876543210",
      "role": "farmer",
      "isPhoneVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "accessTokenExpiresIn": "15d",
      "refreshTokenExpiresIn": "30d"
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `isNewUser` | Boolean | `true` if account was just created, `false` if existing user |
| `user.id` | String | Unique user ID |
| `user.name` | String | User's name |
| `user.mobileNumber` | String | User's mobile number |
| `user.role` | String | User's role |
| `user.isPhoneVerified` | Boolean | Phone verification status |
| `tokens.accessToken` | String | JWT access token (valid for 15 days) |
| `tokens.refreshToken` | String | JWT refresh token (valid for 30 days) |

### Error Responses

**400 Bad Request - Missing Fields:**
```json
{
  "success": false,
  "message": "Mobile number and Firebase token are required",
  "code": "VALIDATION_ERROR"
}
```

**400 Bad Request - Invalid Mobile Format:**
```json
{
  "success": false,
  "message": "Please provide a valid 10-digit mobile number",
  "code": "VALIDATION_ERROR"
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

1. **Check** `isNewUser` field:
   - If `true` → Show welcome message for new user
   - If `false` → Show returning user message

2. **Store tokens securely:**
   - Save `accessToken` in secure storage (AsyncStorage)
   - Save `refreshToken` in secure storage (AsyncStorage)

3. **Save user data:**
   - Store user object for app state management

4. **Navigate:**
   - Redirect to Home/Dashboard screen
   - Show success message

---

## 📌 API 2: Refresh Token

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
| `refreshToken` | String | ✅ Yes | The refresh token received during login |

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

## 📌 API 3: Get Profile

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

## 📌 API 4: Update Profile

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

## 📌 API 5: Logout

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

---

## 🔐 Token Management Guide

### Token Storage
You need to securely store two types of tokens received from Login API:

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

**Save after Login:**
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
| `INVALID_TOKEN` | 401 | Invalid Firebase/JWT token | Ask user to retry or login again |
| `TOKEN_EXPIRED` | 401 | Access token expired | Call refresh-token API |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token expired | Logout and redirect to Login |
| `NO_TOKEN` | 401 | Missing authorization header | Redirect to Login |

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

---

## 🎯 Step-by-Step Integration Flow

### Step 1: User Enters Mobile Number
**In your Login screen:**
- Show input field for Mobile Number
- Show "Send OTP" button

### Step 2: Send OTP via Firebase
**In your React Native app:**
- Use Firebase Phone Auth: `auth().signInWithPhoneNumber('+919876543210')`
- Firebase will send OTP to user's phone
- Store confirmation object for later verification

### Step 3: User Enters OTP
- Show OTP input field (6 digits)
- Show "Verify" button
- Optionally show "Resend OTP" button (cooldown: 30 seconds)

### Step 4: Verify OTP with Firebase
**In your React Native app:**
- Call `confirmation.confirm(otpCode)`
- Get user credential from Firebase
- Extract ID Token: `credential.user.getIdToken()`
- Store this ID Token - you'll send it to backend

### Step 5: Call Login API
```
Request: POST /api/v1/auth/login
Body: {
  mobileNumber: "9876543210",
  firebaseIdToken: "<token-from-step-4>",
  role: "farmer"         // optional, defaults to "farmer"
}
```

### Step 6: Handle Response
**Check `isNewUser` field in response:**
- If `true` → New account was created
  - Show: "Welcome! Your account has been created"
  - Maybe show onboarding flow
- If `false` → Existing user logged in
  - Show: "Welcome back, [name]!"

### Step 7: Store Tokens
- Extract `accessToken` from response
- Extract `refreshToken` from response
- Save both in AsyncStorage/SecureStore
- Save user object in app state

### Step 8: Navigate to Home
- Close login screen
- Navigate to main app screen (Home/Dashboard)

---

## 🧪 Testing Guide

### Test Case 1: New User Login (Auto-creates account)

**Steps:**
1. Open Login screen
2. Enter mobile: "9876543210"
3. Click "Send OTP"
4. Firebase sends OTP to phone
5. Enter OTP received
7. Click "Verify"
8. Backend creates account automatically
9. Tokens received and stored
10. Navigated to Home screen

**Expected Result:**
- ✅ User account created in database
- ✅ Tokens stored in device storage
- ✅ User logged in successfully
- ✅ Response has `isNewUser: true`
- ✅ Welcome message shown

### Test Case 2: Existing User Login

**Steps:**
1. Open Login screen
2. Enter mobile number that's already registered
3. Click "Send OTP"
4. Firebase sends OTP
5. Enter OTP
6. Click "Verify"
7. Backend logs in user
8. Tokens received

**Expected Result:**
- ✅ User logged in successfully
- ✅ Response has `isNewUser: false`
- ✅ Welcome back message shown
- ✅ Navigated to Home screen

### Test Case 3: Token Refresh

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

### Test Case 4: Refresh Token Expired

**Steps:**
1. Login successfully
2. Manually expire both tokens
3. Call any protected API
4. Token refresh fails

**Expected Result:**
- ✅ All tokens cleared from storage
- ✅ User redirected to Login screen
- ✅ Message: "Session expired. Please login again."

### Test Case 5: Logout

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

### Issue 5: User created with default name like "User_9999"
**Cause:**
- Login API automatically assigns default name based on last 4 digits of mobile number
- This is normal behavior for the simplified login flow

**Solution:**
- After login, use "Update Profile" API (PUT /profile) to set custom name
- Add a profile completion screen where users can enter their name
- Show prompt: "Please complete your profile" after first login
- This provides flexibility - users can login quickly without friction

---

## 📞 Testing APIs Using Postman

You can test the Login API using Postman before implementing in React Native.

### Test Login/Auto-create Flow

**Step 1: Get Firebase Token**
- Use Firebase Console or your React Native app
- Verify OTP and get ID Token
- Copy the token for next step

**Step 2: Login (will auto-create if new)**
```
POST {{baseUrl}}/auth/login
Body: {
  "mobileNumber": "9876543210",
  "firebaseIdToken": "<paste-token-here>",
  "role": "farmer"
}
```
- Check response has `isNewUser: true` (if new) or `false` (if exists)
- New users will have default name like "User_9999"
- Copy `accessToken` and `refreshToken` from response

**Step 3: Get Profile**
```
GET {{baseUrl}}/auth/me
Headers: Authorization: Bearer <paste-access-token>
```

**Step 4: Update Profile**
```
PUT {{baseUrl}}/auth/profile
Headers: Authorization: Bearer <paste-access-token>
Body: {
  "district": "Ahmedabad",
  "market": "Naroda APMC"
}
```

**Step 5: Logout**
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
   - Validate name if provided (min 2 characters)

5. **Handle errors gracefully:**
   - Show user-friendly messages
   - Don't expose technical details
   - Log errors for debugging

### DON'Ts ❌

1. **Never store Firebase ID Token:**
   - Only use it once for login
   - Don't store it permanently
   - Get fresh token for each login

2. **Don't hardcode API URLs:**
   - Use environment variables
   - Different URLs for dev/staging/production

3. **Don't skip error handling:**
   - Always handle network errors
   - Always handle invalid responses
   - Always validate responses

4. **Don't ignore token refresh:**
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
- [ ] New user auto-creation tested
- [ ] Existing user login tested
- [ ] OTP verification tested
- [ ] Token refresh tested
- [ ] Logout tested
- [ ] Network error handling tested
- [ ] Session expiry tested

---

## 📚 Additional Resources

### Backend Documentation
- **Authentication API Guide (Backend):** `AUTHENTICATION_API_GUIDE.md` - Complete backend documentation
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
   # Start backend server
   cd backend
   npm start
   ```

2. **Test API with Postman first:**
   - Import collection
   - Test login endpoint
   - Check request/response

3. **Check Firebase setup:**
   ```bash
   npm run check:firebase
   ```

4. **Review error logs:**
   - Check backend console for errors
   - Check React Native debugger console
   - Check network tab in debugger

---

**Last Updated:** February 16, 2026  
**Version:** 3.0.0 (Simplified Login-Only Flow)  
**Backend API:** APMC Khetivadi v1  
**Documentation Type:** API Reference for React Native Developers

---

## 🎉 Summary

This guide provided you with:

✅ **Simplified authentication flow** - No separate signup, just login  
✅ **Auto-create functionality** - Users are created automatically if they don't exist  
✅ **Complete Login API documentation** - Request/Response formats, all fields explained  
✅ **5 Essential APIs** - Login, Refresh Token, Get Profile, Update Profile, Logout  
✅ **Error codes and handling** - All error scenarios documented  
✅ **Token management guide** - How to store, refresh, and use tokens  
✅ **Step-by-step integration flow** - From OTP to logged-in user  
✅ **Testing guide with test cases** - How to test each scenario  
✅ **Common issues and solutions** - Troubleshooting help  
✅ **Security best practices** - DO's and DON'Ts  
✅ **Pre-launch checklist** - Complete deployment checklist  

**You now have everything needed to integrate the simplified authentication in your React Native app!**

Need backend documentation? Check: `AUTHENTICATION_API_GUIDE.md`
