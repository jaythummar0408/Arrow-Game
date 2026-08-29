const admin = require("firebase-admin");

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Should be called once at server startup
 */
const initializeFirebase = () => {
  if (!firebaseInitialized && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log("✅ Firebase Admin initialized");
      return true;
    } catch (error) {
      console.error("❌ Firebase Admin initialization failed:", error.message);
      return false;
    }
  }
  return firebaseInitialized;
};

/**
 * Check if Firebase is initialized
 */
const isFirebaseInitialized = () => {
  return firebaseInitialized;
};

/**
 * Get Firebase Admin instance
 */
const getFirebaseAdmin = () => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin;
};

module.exports = {
  initializeFirebase,
  isFirebaseInitialized,
  getFirebaseAdmin,
  admin,
};
