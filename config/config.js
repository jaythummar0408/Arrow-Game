require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/APMC",
  dbName: process.env.DB_NAME || "APMC",
  jwtSecret: process.env.JWT_SECRET || "default_secret_key",
  apiVersion: process.env.API_VERSION || "v1",
};
