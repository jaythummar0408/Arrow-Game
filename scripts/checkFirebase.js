/**
 * Firebase Configuration Check Script
 * Verifies Firebase Admin SDK setup and authentication readiness
 */

require("dotenv").config();
const admin = require("firebase-admin");

console.log("\n🔍 FIREBASE CONFIGURATION CHECK\n");
console.log("=".repeat(60));

// Check 1: Environment Variable
console.log("\n1️⃣  Checking FIREBASE_SERVICE_ACCOUNT environment variable...");
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log("❌ FIREBASE_SERVICE_ACCOUNT not found in .env file");
  process.exit(1);
}
console.log("✅ FIREBASE_SERVICE_ACCOUNT exists in environment");

// Check 2: Parse JSON
console.log("\n2️⃣  Parsing Firebase service account JSON...");
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log("✅ Firebase service account JSON parsed successfully");
} catch (error) {
  console.log("❌ Failed to parse Firebase service account JSON");
  console.log("   Error:", error.message);
  process.exit(1);
}

// Check 3: Validate required fields
console.log("\n3️⃣  Validating service account fields...");
const requiredFields = [
  "type",
  "project_id",
  "private_key_id",
  "private_key",
  "client_email",
  "client_id",
];

let allFieldsPresent = true;
requiredFields.forEach((field) => {
  if (serviceAccount[field]) {
    console.log(`   ✅ ${field}: Present`);
  } else {
    console.log(`   ❌ ${field}: Missing`);
    allFieldsPresent = false;
  }
});

if (!allFieldsPresent) {
  console.log("\n❌ Some required fields are missing");
  process.exit(1);
}

// Check 4: Initialize Firebase Admin SDK
console.log("\n4️⃣  Initializing Firebase Admin SDK...");
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.log("❌ Firebase Admin SDK initialization failed");
  console.log("   Error:", error.message);
  process.exit(1);
}

// Check 5: Display configuration details
console.log("\n5️⃣  Firebase Configuration Details:");
console.log("   📧 Service Account:", serviceAccount.client_email);
console.log("   🆔 Project ID:", serviceAccount.project_id);
console.log("   📱 Auth URI:", serviceAccount.auth_uri);
console.log("   🔑 Token URI:", serviceAccount.token_uri);

// Check 6: Test Firebase Auth methods availability
console.log("\n6️⃣  Checking Firebase Auth methods...");
try {
  const auth = admin.auth();
  console.log("✅ admin.auth() accessible");
  console.log(
    "✅ verifyIdToken method:",
    typeof auth.verifyIdToken === "function" ? "Available" : "Not available",
  );
  console.log(
    "✅ getUser method:",
    typeof auth.getUser === "function" ? "Available" : "Not available",
  );
} catch (error) {
  console.log("❌ Error accessing Firebase Auth:", error.message);
}

// Check 7: JWT Secrets
console.log("\n7️⃣  Checking JWT secrets...");
if (
  process.env.JWT_ACCESS_SECRET &&
  process.env.JWT_ACCESS_SECRET !==
    "your_access_token_secret_key_here_change_in_production"
) {
  console.log("✅ JWT_ACCESS_SECRET is configured");
} else {
  console.log("⚠️  JWT_ACCESS_SECRET needs a strong value");
}

if (
  process.env.JWT_REFRESH_SECRET &&
  process.env.JWT_REFRESH_SECRET !==
    "your_refresh_token_secret_key_here_change_in_production"
) {
  console.log("✅ JWT_REFRESH_SECRET is configured");
} else {
  console.log("⚠️  JWT_REFRESH_SECRET needs a strong value");
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("\n✅ FIREBASE CONFIGURATION CHECK COMPLETE\n");
console.log("🎉 Your Firebase Admin SDK is properly configured!");
console.log("\n📝 Next Steps:");
console.log("   1. Start your server: npm start");
console.log("   2. Test authentication: node scripts/testAuthAPI.js");
console.log("   3. Enable Phone Authentication in Firebase Console:");
console.log(
  "      https://console.firebase.google.com/project/farmerpulse-ab617/authentication/providers",
);
console.log("\n💡 Tips:");
console.log("   - Ensure Phone auth is enabled in Firebase Console");
console.log("   - Add authorized domains for production");
console.log("   - Keep your service account JSON secure\n");
