# Authentication API Guide

Complete guide for implementing user authentication in the APMC Khetivadi application with Firebase Auth and JWT tokens.

## Overview

The authentication system uses:
- **Firebase Authentication** for phone number verification
- **JWT Tokens** for API authorization (stored in your database, not Firebase)
- **Dual Token System**: Access Token (15 days) + Refresh Token (30 days)
- **User Data Storage**: MongoDB (not Firebase Database)

## Table of Contents

1. [Setup](#setup)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Token Management](#token-management)
5. [Role-Based Access](#role-based-access)
6. [React Native Integration](#react-native-integration)
7. [Security Best Practices](#security-best-practices)

---

## Setup

### 1. Backend Configuration

Add these environment variables to your `.env` file:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your_access_token_secret_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_key_here

# Firebase Configuration (Service Account JSON as single line)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"..."}
```

**Generate Strong Secrets:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Authentication** → **Phone** sign-in method
4. Go to **Project Settings** → **Service Accounts**
5. Click **Generate New Private Key**
6. Copy the JSON content and format as single line for `.env` file

---

## Authentication Flow

### Signup Flow

```
User (React Native App)
    ↓
1. Enter Name + Mobile Number
    ↓
2. Firebase Phone Auth (OTP Verification)
    ↓
3. Get Firebase ID Token
    ↓
4. POST /api/v1/auth/signup
   { name, mobileNumber, firebaseIdToken, role }
    ↓
5. Backend validates Firebase token
    ↓
6. Create user in MongoDB
    ↓
7. Generate JWT tokens (access + refresh)
    ↓
8. Return tokens + user data
    ↓
9. Store tokens securely in app
```

### Login Flow

```
User (React Native App)
    ↓
1. Enter Mobile Number
    ↓
2. Firebase Phone Auth (OTP Verification)
    ↓
3. Get Firebase ID Token
    ↓
4. POST /api/v1/auth/login
   { mobileNumber, firebaseIdToken }
    ↓
5. Backend validates Firebase token
    ↓
6. Generate new JWT tokens
    ↓
7. Return tokens + user data
    ↓
8. Store tokens securely in app
```

---

## API Endpoints

### 1. Signup (Register New User)

**Endpoint:** `POST /api/v1/auth/signup`

**Request Body:**
```json
{
  "name": "Rajesh Patel",
  "mobileNumber": "9876543210",
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "farmer"
}
```

**Parameters:**
- `name` (required): User's full name (2-100 characters)
- `mobileNumber` (required): 10-digit mobile number
- `firebaseIdToken` (optional): Firebase ID token for phone verification
- `role` (optional): `farmer` | `trader` | `admin` (default: `farmer`)

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "65f1234567890abcdef12345",
      "name": "Rajesh Patel",
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

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "User with this mobile number already exists"
}
```

---

### 2. Login

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "mobileNumber": "9876543210",
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Parameters:**
- `mobileNumber` (required): 10-digit mobile number
- `firebaseIdToken` (required): Firebase ID token

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65f1234567890abcdef12345",
      "name": "Rajesh Patel",
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

---

### 3. Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresIn": "15d"
  }
}
```

**Usage:** Call this endpoint when access token expires to get a new one without requiring Firebase authentication again.

---

### 4. Get Profile (Me)

**Endpoint:** `GET /api/v1/auth/me`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "65f1234567890abcdef12345",
      "name": "Rajesh Patel",
      "mobileNumber": "9876543210",
      "role": "farmer",
      "isActive": true,
      "isPhoneVerified": true,
      "preferredLanguage": "gu",
      "district": {
        "_id": "65a1234567890abcdef12346",
        "name": "Ahmedabad",
        "gujaratiName": "અમદાવાદ"
      },
      "market": {
        "_id": "65b1234567890abcdef12347",
        "name": "Bavla",
        "gujaratiName": "બાવળા"
      },
      "createdAt": "2026-02-16T10:30:00.000Z",
      "updatedAt": "2026-02-16T10:30:00.000Z"
    }
  }
}
```

---

### 5. Update Profile

**Endpoint:** `PUT /api/v1/auth/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "Rajesh Bhai Patel",
  "district": "65a1234567890abcdef12346",
  "market": "65b1234567890abcdef12347",
  "preferredLanguage": "gu"
}
```

**Parameters (all optional):**
- `name`: Updated name
- `district`: District ObjectId
- `market`: Market ObjectId
- `preferredLanguage`: `en` | `gu` | `hi`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

---

### 6. Verify Phone

**Endpoint:** `POST /api/v1/auth/verify-phone`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Phone verified successfully",
  "data": {
    "isPhoneVerified": true
  }
}
```

---

### 7. Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** This invalidates the refresh token on the server. Client should also delete stored tokens.

---

## Token Management

### Access Token
- **Expiry:** 15 days
- **Purpose:** Authorize API requests
- **Usage:** Include in `Authorization: Bearer {token}` header
- **Storage:** Secure storage (AsyncStorage in React Native)

### Refresh Token
- **Expiry:** 30 days
- **Purpose:** Generate new access tokens
- **Usage:** Only for `/auth/refresh-token` endpoint
- **Storage:** Secure storage (AsyncStorage in React Native)

### Token Payload Structure

```javascript
{
  userId: "65f1234567890abcdef12345",
  mobileNumber: "9876543210",
  role: "farmer",
  name: "Rajesh Patel",
  iat: 1708076400,  // Issued at
  exp: 1709372400   // Expiry
}
```

### Handling Token Expiry

```javascript
// Pseudo-code for React Native
async function apiCall(endpoint, options) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers
      }
    });
    
    if (response.status === 401) {
      const data = await response.json();
      
      // Token expired - refresh it
      if (data.code === 'TOKEN_EXPIRED') {
        const newAccessToken = await refreshAccessToken();
        // Retry the request with new token
        return apiCall(endpoint, options);
      }
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
  }
}

async function refreshAccessToken() {
  const response = await fetch('/api/v1/auth/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    await AsyncStorage.setItem('accessToken', data.data.accessToken);
    return data.data.accessToken;
  } else {
    // Refresh token also expired - require login
    navigateToLogin();
  }
}
```

---

## Role-Based Access

### Available Roles

1. **farmer** (default)
   - View market prices
   - Access analytics
   - Update own profile

2. **trader**
   - All farmer permissions
   - Access trader-specific features (future)

3. **admin**
   - All permissions
   - User management
   - System configuration

### Middleware Usage

```javascript
const { verifyToken, requireRole, requireAdmin } = require('./middleware/auth');

// Protect route - any authenticated user
router.get('/profile', verifyToken, getProfile);

// Require specific role
router.post('/admin/users', verifyToken, requireAdmin, createUser);

// Multiple roles allowed
router.get('/data', verifyToken, requireRole('farmer', 'trader'), getData);
```

---

## React Native Integration

### 1. Install Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/auth
npm install @react-native-async-storage/async-storage
npm install axios
```

### 2. Firebase Phone Authentication

```javascript
import auth from '@react-native-firebase/auth';
import { useState } from 'react';

export function usePhoneAuth() {
  const [confirmation, setConfirmation] = useState(null);

  // Step 1: Send OTP
  async function sendOTP(phoneNumber) {
    try {
      // Add country code if not present
      const fullNumber = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;
      
      const confirmation = await auth().signInWithPhoneNumber(fullNumber);
      setConfirmation(confirmation);
      return { success: true };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, error: error.message };
    }
  }

  // Step 2: Verify OTP
  async function verifyOTP(otp) {
    try {
      const userCredential = await confirmation.confirm(otp);
      const idToken = await userCredential.user.getIdToken();
      return { success: true, idToken, user: userCredential.user };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  }

  return { sendOTP, verifyOTP };
}
```

### 3. Authentication Service

```javascript
// services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://your-api-url.com/api/v1';

class AuthService {
  // Signup
  async signup(name, mobileNumber, firebaseIdToken, role = 'farmer') {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        name,
        mobileNumber,
        firebaseIdToken,
        role,
      });

      if (response.data.success) {
        // Store tokens
        await this.storeTokens(
          response.data.data.tokens.accessToken,
          response.data.data.tokens.refreshToken
        );
        return { success: true, user: response.data.data.user };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Signup failed' 
      };
    }
  }

  // Login
  async login(mobileNumber, firebaseIdToken) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        mobileNumber,
        firebaseIdToken,
      });

      if (response.data.success) {
        await this.storeTokens(
          response.data.data.tokens.accessToken,
          response.data.data.tokens.refreshToken
        );
        return { success: true, user: response.data.data.user };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  }

  // Store tokens securely
  async storeTokens(accessToken, refreshToken) {
    try {
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  // Get access token
  async getAccessToken() {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
      });

      if (response.data.success) {
        await AsyncStorage.setItem(
          'accessToken',
          response.data.data.accessToken
        );
        return response.data.data.accessToken;
      }
    } catch (error) {
      // Refresh token expired - logout
      await this.logout();
      return null;
    }
  }

  // Logout
  async logout() {
    try {
      const accessToken = await this.getAccessToken();
      
      // Call logout API
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens from storage
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    }
  }

  // Check if user is logged in
  async isLoggedIn() {
    const accessToken = await this.getAccessToken();
    return !!accessToken;
  }
}

export default new AuthService();
```

### 4. Axios Interceptor for Auto Token Refresh

```javascript
// utils/axiosConfig.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://your-api-url.com/api/v1',
});

// Request interceptor - add access token
api.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't retried yet
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Refresh token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken }
        );

        if (response.data.success) {
          const newAccessToken = response.data.data.accessToken;
          await AsyncStorage.setItem('accessToken', newAccessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // Navigate to login screen
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 5. Complete Signup Flow Component

```javascript
// screens/SignupScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { usePhoneAuth } from '../hooks/usePhoneAuth';
import AuthService from '../services/authService';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { sendOTP, verifyOTP } = usePhoneAuth();

  // Step 1: Send OTP
  async function handleSendOTP() {
    if (!name || !mobileNumber) {
      setError('Please enter name and mobile number');
      return;
    }

    setLoading(true);
    setError('');

    const result = await sendOTP(mobileNumber);
    
    if (result.success) {
      setStep(2);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }

  // Step 2: Verify OTP and Signup
  async function handleVerifyAndSignup() {
    if (!otp) {
      setError('Please enter OTP');
      return;
    }

    setLoading(true);
    setError('');

    // Verify OTP with Firebase
    const verifyResult = await verifyOTP(otp);
    
    if (!verifyResult.success) {
      setError(verifyResult.error);
      setLoading(false);
      return;
    }

    // Signup with backend
    const signupResult = await AuthService.signup(
      name,
      mobileNumber,
      verifyResult.idToken,
      'farmer'
    );

    setLoading(false);

    if (signupResult.success) {
      // Navigate to home screen
      navigation.replace('Home');
    } else {
      setError(signupResult.message);
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Signup</Text>

      {step === 1 ? (
        <>
          <TextInput
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          <TextInput
            placeholder="Mobile Number"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            maxLength={10}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          <Button
            title={loading ? 'Sending OTP...' : 'Send OTP'}
            onPress={handleSendOTP}
            disabled={loading}
          />
        </>
      ) : (
        <>
          <Text style={{ marginBottom: 10 }}>
            OTP sent to +91{mobileNumber}
          </Text>
          <TextInput
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          <Button
            title={loading ? 'Verifying...' : 'Verify & Signup'}
            onPress={handleVerifyAndSignup}
            disabled={loading}
          />
        </>
      )}

      {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}

      <Button
        title="Already have an account? Login"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
}
```

---

## Security Best Practices

### 1. Token Storage
- ✅ Use `@react-native-async-storage/async-storage` for React Native
- ✅ Never store tokens in plain text in code
- ✅ Don't log tokens in console (production)
- ❌ Never store in local state only (will be lost on app restart)

### 2. API Security
- ✅ Always use HTTPS in production
- ✅ Validate Firebase tokens on backend
- ✅ Implement rate limiting on auth endpoints
- ✅ Use strong JWT secrets (32+ characters, random)
- ✅ Set appropriate token expiry times

### 3. Environment Variables
- ✅ Use different Firebase projects for dev/staging/production
- ✅ Never commit `.env` file to version control
- ✅ Use environment-specific configurations
- ✅ Rotate JWT secrets periodically

### 4. Error Handling
- ✅ Don't expose detailed error messages in production
- ✅ Log authentication failures for monitoring
- ✅ Implement proper retry logic
- ✅ Handle network errors gracefully

### 5. User Data
- ✅ Store minimal user data
- ✅ Hash/encrypt sensitive data
- ✅ Implement data retention policies
- ✅ Allow users to delete their accounts

---

## Testing

### Test Signup Flow

```bash
# 1. Register new user
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "mobileNumber": "9999999999",
    "firebaseIdToken": "test_token_from_firebase",
    "role": "farmer"
  }'

# Save tokens from response
```

### Test Protected Endpoint

```bash
# Use access token from signup/login
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Token Refresh

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Troubleshooting

### Common Issues

**1. Firebase Token Verification Failed**
- Ensure Firebase Admin SDK is properly initialized
- Check FIREBASE_SERVICE_ACCOUNT environment variable
- Verify Firebase project matches the client app

**2. JWT Token Invalid**
- Check JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are set
- Ensure token hasn't expired
- Verify Authorization header format: `Bearer {token}`

**3. User Already Exists**
- Mobile number must be unique
- Use login endpoint instead of signup

**4. Phone Not Verified**
- Ensure Firebase authentication completed
- Check firebaseIdToken is valid
- Verify phone number matches Firebase user

---

## Next Steps

1. ✅ Implement authentication in React Native app
2. ⏭️ Add social login (Google, Facebook)
3. ⏭️ Implement forgot password flow
4. ⏭️ Add email verification
5. ⏭️ Implement 2FA (Two-Factor Authentication)
6. ⏭️ Add device tracking
7. ⏭️ Implement session management
8. ⏭️ Add admin user management panel

---

## Support

For issues or questions:
- Check API logs: `pm2 logs` or console output
- Test with Postman collection
- Review Firebase Console for auth issues
- Check MongoDB for user data

---

**Last Updated:** February 16, 2026
**Version:** 1.0.0
