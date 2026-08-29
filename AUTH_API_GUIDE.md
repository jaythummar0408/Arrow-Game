# Authentication API Guide

## Overview

This guide covers the complete authentication system for APMC Khetivadi app, including mobile number-based signup with Firebase Authentication, JWT token management, and user profile operations.

## Features

- 📱 **Mobile Number Authentication**: Firebase-based phone verification
- 🔐 **JWT Token Management**: Separate access and refresh tokens
- 👨‍🌾 **Farmer-First Design**: Optimized for farmer users with Gujarati support
- 🔄 **Token Refresh**: Automatic token refresh mechanism
- 🛡️ **Role-Based Access**: Support for farmer, trader, and admin roles

## Token Expiry Configuration

- **Access Token**: 15 days
- **Refresh Token**: 30 days

## Base URL

```
http://localhost:5000/api/v1/auth
```

---

## Authentication Flow

### 1. Signup Flow

```
User Opens App
      ↓
User Enters Name & Mobile Number
      ↓
Firebase OTP Sent
      ↓
User Enters OTP
      ↓
Firebase Verifies OTP → Returns ID Token
      ↓
App Sends: name, mobileNumber, firebaseIdToken
      ↓
Backend Creates User in DB
      ↓
Backend Returns: Access Token + Refresh Token
```

### 2. Login Flow

```
User Opens App
      ↓
User Enters Mobile Number
      ↓
Firebase OTP Sent
      ↓
User Enters OTP
      ↓
Firebase Verifies OTP → Returns ID Token
      ↓
App Sends: mobileNumber, firebaseIdToken
      ↓
Backend Verifies User Exists
      ↓
Backend Returns: Access Token + Refresh Token
```

### 3. Token Refresh Flow

```
Access Token Expires (15 days)
      ↓
App Detects 401 Error
      ↓
App Sends Refresh Token
      ↓
Backend Validates Refresh Token
      ↓
Backend Returns New Access Token
```

---

## API Endpoints

### 1. Signup

Register a new user with mobile number and Firebase verification.

**Endpoint:** `POST /api/v1/auth/signup`

**Request Body:**
```json
{
  "name": "રાજેશ પટેલ",
  "mobileNumber": "9876543210",
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "farmer"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User's name (supports Gujarati) |
| mobileNumber | string | Yes | 10-digit mobile number |
| firebaseIdToken | string | Yes | Firebase ID token from phone auth |
| role | string | No | User role (default: "farmer") |

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "65f7a1b2c3d4e5f6g7h8i9j0",
      "name": "રાજેશ પટેલ",
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

**Error Responses:**

```json
// 400 - Validation Error
{
  "success": false,
  "message": "Name and mobile number are required"
}

// 400 - User Already Exists
{
  "success": false,
  "message": "User with this mobile number already exists"
}

// 401 - Invalid Firebase Token
{
  "success": false,
  "message": "Invalid Firebase token"
}
```

---

### 2. Login

Login existing user with mobile number and Firebase verification.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "mobileNumber": "9876543210",
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65f7a1b2c3d4e5f6g7h8i9j0",
      "name": "રાજેશ પટેલ",
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

**Error Responses:**

```json
// 404 - User Not Found
{
  "success": false,
  "message": "User not found. Please sign up first."
}

// 403 - Account Inactive
{
  "success": false,
  "message": "Account is inactive or phone not verified"
}

// 401 - Invalid Token
{
  "success": false,
  "message": "Invalid Firebase token"
}
```

---

### 3. Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /api/v1/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
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

**Error Responses:**

```json
// 401 - Invalid or Expired Token
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

---

### 4. Get Profile

Get current user's profile information.

**Endpoint:** `GET /api/v1/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65f7a1b2c3d4e5f6g7h8i9j0",
      "name": "રાજેશ પટેલ",
      "mobileNumber": "9876543210",
      "role": "farmer",
      "isActive": true,
      "isPhoneVerified": true,
      "preferredLanguage": "gu",
      "district": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Ahmedabad",
        "gujaratiName": "અમદાવાદ"
      },
      "market": {
        "_id": "65b1c2d3e4f5g6h7i8j9k0l1",
        "name": "Bavla",
        "gujaratiName": "બાવળા"
      },
      "createdAt": "2024-03-17T10:30:00.000Z",
      "updatedAt": "2024-03-17T10:30:00.000Z"
    }
  }
}
```

---

### 5. Update Profile

Update user profile information.

**Endpoint:** `PUT /api/v1/auth/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "રાજેશ કુમાર પટેલ",
  "district": "65a1b2c3d4e5f6g7h8i9j0k1",
  "market": "65b1c2d3e4f5g6h7i8j9k0l1",
  "preferredLanguage": "gu"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "65f7a1b2c3d4e5f6g7h8i9j0",
      "name": "રાજેશ કુમાર પટેલ",
      "mobileNumber": "9876543210",
      "district": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Ahmedabad"
      },
      "market": {
        "_id": "65b1c2d3e4f5g6h7i8j9k0l1",
        "name": "Bavla"
      },
      "preferredLanguage": "gu"
    }
  }
}
```

---

### 6. Verify Phone

Verify phone number with Firebase token (if not verified during signup).

**Endpoint:** `POST /api/v1/auth/verify-phone`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
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

Logout user by invalidating refresh token.

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Using Protected Routes

To access protected routes, include the access token in the Authorization header:

```javascript
// Example: Axios
const response = await axios.get('http://localhost:5000/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Example: Fetch
const response = await fetch('http://localhost:5000/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## Token Management in React Native

### Storing Tokens Securely

Use `@react-native-async-storage/async-storage` or `expo-secure-store`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store tokens
await AsyncStorage.setItem('accessToken', accessToken);
await AsyncStorage.setItem('refreshToken', refreshToken);

// Retrieve tokens
const accessToken = await AsyncStorage.getItem('accessToken');
const refreshToken = await AsyncStorage.getItem('refreshToken');

// Clear tokens (logout)
await AsyncStorage.removeItem('accessToken');
await AsyncStorage.removeItem('refreshToken');
```

### Automatic Token Refresh

```javascript
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://your-api-url/api/v1'
});

// Request interceptor - add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        // Request new access token
        const response = await axios.post(
          'http://your-api-url/api/v1/auth/refresh-token',
          { refreshToken }
        );

        const { accessToken } = response.data.data;
        
        // Store new token
        await AsyncStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        // Navigate to login screen
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Firebase Setup for React Native

### 1. Install Firebase

```bash
npm install @react-native-firebase/app @react-native-firebase/auth
```

### 2. Configure Firebase

Add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to your React Native project.

### 3. Phone Authentication Example

```javascript
import auth from '@react-native-firebase/auth';
import { useState } from 'react';

export const usePhoneAuth = () => {
  const [confirm, setConfirm] = useState(null);

  // Send OTP
  const sendOTP = async (mobileNumber) => {
    try {
      const confirmation = await auth().signInWithPhoneNumber(`+91${mobileNumber}`);
      setConfirm(confirmation);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Verify OTP
  const verifyOTP = async (code) => {
    try {
      const userCredential = await confirm.confirm(code);
      const idToken = await userCredential.user.getIdToken();
      return { success: true, idToken };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return { sendOTP, verifyOTP };
};
```

### 4. Complete Signup Flow

```javascript
import api from './api'; // Your axios instance
import { usePhoneAuth } from './usePhoneAuth';

const SignupScreen = () => {
  const { sendOTP, verifyOTP } = usePhoneAuth();
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: enter details, 2: enter OTP

  const handleSendOTP = async () => {
    const result = await sendOTP(mobileNumber);
    if (result.success) {
      setStep(2);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleVerifyAndSignup = async () => {
    // Verify OTP with Firebase
    const result = await verifyOTP(otp);
    
    if (result.success) {
      try {
        // Send to backend
        const response = await api.post('/auth/signup', {
          name,
          mobileNumber,
          firebaseIdToken: result.idToken,
          role: 'farmer'
        });

        // Store tokens
        await AsyncStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);

        // Navigate to home screen
        navigation.navigate('Home');
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Signup failed');
      }
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    // Your UI here
  );
};
```

---

## Security Best Practices

1. **Never Store Tokens in Plain Text**
   - Use secure storage mechanisms
   - On React Native, use `expo-secure-store` or `react-native-keychain`

2. **Handle Token Expiry Gracefully**
   - Implement automatic refresh
   - Show appropriate UI when tokens expire

3. **Validate Input**
   - Always validate mobile number format
   - Sanitize user input

4. **Use HTTPS in Production**
   - Never send tokens over HTTP
   - Use SSL/TLS certificates

5. **Implement Rate Limiting**
   - Prevent brute force attacks
   - Limit OTP requests per number

6. **Monitor Suspicious Activity**
   - Log failed login attempts
   - Implement device fingerprinting

---

## Error Codes Reference

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Invalid input or missing required fields |
| 401 | Unauthorized | Invalid or expired token |
| 403 | Forbidden | Account inactive or insufficient permissions |
| 404 | Not Found | User not found |
| 500 | Internal Server Error | Server-side error |

---

## Testing

Use the provided test script to test authentication endpoints:

```bash
node scripts/testAuthAPI.js
```

Or use the Postman collection: `APMC_Khetivadi_API.postman_collection.json`

---

## Environment Variables

Make sure to set these in your `.env` file:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your_access_token_secret_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_key_here

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

---

## Support

For issues or questions:
- Check the [Master API Guide](MASTER_API_GUIDE.md)
- Review [Quick Reference](QUICK_REFERENCE.md)
- Contact: support@apmckhetivadi.com
