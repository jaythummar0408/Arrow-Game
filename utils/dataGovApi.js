const axios = require("axios");
require("dotenv").config();

// API Configuration from environment variables
const API_CONFIG = {
  baseURL: process.env.DATA_GOV_BASE_URL || "https://api.data.gov.in/resource",
  apiKey: process.env.DATA_GOV_API_KEY,
  headers: {
    accept: "application/json",
  },
};

// Validate API key
if (!API_CONFIG.apiKey) {
  throw new Error("DATA_GOV_API_KEY is not defined in environment variables");
}

/**
 * Fetch Historical Commodity Price Data
 * API 1: Past days commodity price details
 * @param {Object} filters - Filter parameters
 * @param {string} filters.state - State name (e.g., 'Gujarat')
 * @param {string} filters.district - District name (e.g., 'Junagarh')
 * @param {string} filters.market - Market name (optional)
 * @param {string} filters.commodity - Commodity name (e.g., 'Soyabean')
 * @param {string} filters.variety - Variety name (optional)
 * @param {string} filters.grade - Grade name (optional)
 * @param {number} limit - Number of records to fetch (default: 2000)
 * @returns {Promise<Object>} API response with historical price data
 */
const fetchHistoricalPrices = async (filters = {}, limit = 2000) => {
  try {
    // Validate limit
    if (limit < 1 || limit > 10000) {
      throw new Error("Limit must be between 1 and 10000");
    }

    const params = new URLSearchParams({
      "api-key": API_CONFIG.apiKey,
      format: "json",
      limit: limit.toString(),
    });

    // Add filters
    if (filters.state) {
      params.append("filters[state.keyword]", filters.state);
    }
    if (filters.district) {
      params.append("filters[district]", filters.district);
    }
    if (filters.market) {
      params.append("filters[market]", filters.market);
    }
    if (filters.commodity) {
      params.append("filters[commodity]", filters.commodity);
    }
    if (filters.variety) {
      params.append("filters[variety]", filters.variety);
    }
    if (filters.grade) {
      params.append("filters[grade]", filters.grade);
    }

    const url = `${API_CONFIG.baseURL}/9ef84268-d588-465a-a308-a864a43d0070?${params.toString()}`;

    const response = await axios.get(url, {
      headers: API_CONFIG.headers,
      timeout: 30000, // 30 second timeout
    });

    // Validate response structure
    if (!response.data) {
      throw new Error("API returned empty response");
    }

    if (!response.data.records || !Array.isArray(response.data.records)) {
      console.warn("⚠️  API response missing records array");
      return {
        success: true,
        data: { records: [] },
        count: 0,
      };
    }

    return {
      success: true,
      data: response.data,
      count: response.data.records?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching historical prices:", error.message);

    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code === "ECONNABORTED") {
      errorMessage = "Request timeout - API did not respond in time";
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage = "Cannot connect to API - Check network connection";
    } else if (error.response) {
      errorMessage = `API error (${error.response.status}): ${error.response.statusText}`;
    }

    return {
      success: false,
      error: errorMessage,
      data: null,
    };
  }
};

/**
 * Fetch Daily Commodity Price Data
 * API 2: Daily price data for specific date
 * @param {Object} filters - Filter parameters
 * @param {string} filters.state - State name (e.g., 'Gujarat')
 * @param {string} filters.district - District name (e.g., 'Amreli')
 * @param {string} filters.commodity - Commodity name (e.g., 'Soyabean')
 * @param {string} filters.arrivalDate - Arrival date (format: 'DD-MM-YYYY', e.g., '10-02-2026')
 * @param {number} limit - Number of records to fetch (default: 3000)
 * @returns {Promise<Object>} API response with daily price data
 */
const fetchDailyPrices = async (filters = {}, limit = 1500) => {
  try {
    // Validate limit
    if (limit < 1 || limit > 10000) {
      throw new Error("Limit must be between 1 and 10000");
    }

    const params = new URLSearchParams({
      "api-key": API_CONFIG.apiKey,
      format: "json",
      limit: limit.toString(),
    });

    // Add filters
    if (filters.state) {
      params.append("filters[state.keyword]", filters.state);
    }
    if (filters.district) {
      params.append("filters[district.keyword]", filters.district);
    }
    if (filters.commodity) {
      params.append("filters[commodity.keyword]", filters.commodity);
    }
    if (filters.arrivalDate) {
      params.append("filters[arrival_date.keyword]", filters.arrivalDate);
    }

    const url = `${API_CONFIG.baseURL}/9ef84268-d588-465a-a308-a864a43d0070?${params.toString()}`;

    const response = await axios.get(url, {
      headers: API_CONFIG.headers,
      timeout: 30000, // 30 second timeout
    });

    console.log(`📥 Fetched ${response.data.records?.length || 0} records`);
    console.log({ url });

    // Validate response structure
    if (!response.data) {
      throw new Error("API returned empty response");
    }

    if (!response.data.records || !Array.isArray(response.data.records)) {
      console.warn("⚠️  API response missing records array");
      return {
        success: true,
        data: { records: [] },
        count: 0,
      };
    }

    return {
      success: true,
      data: response.data,
      count: response.data.records?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching daily prices:", error.message);

    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code === "ECONNABORTED") {
      errorMessage = "Request timeout - API did not respond in time";
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage = "Cannot connect to API - Check network connection";
    } else if (error.response) {
      errorMessage = `API error (${error.response.status}): ${error.response.statusText}`;
    }

    return {
      success: false,
      error: errorMessage,
      data: null,
    };
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchPastDayPrices = async (filters = {}, limit = 1500) => {
  const params = new URLSearchParams({
    "api-key": API_CONFIG.apiKey,
    format: "json",
    limit: limit.toString(),
  });

  // Add filters
  if (filters.state) {
    params.append("filters[State]", filters.state);
  }
  if (filters.district) {
    params.append("filters[District]", filters.district);
  }
  if (filters.commodity) {
    params.append("filters[Commodity]", filters.commodity);
  }
  if (filters.arrivalDate) {
    params.append("filters[Arrival_Date]", filters.arrivalDate);
  }

  const url = `${API_CONFIG.baseURL}/35985678-0d79-46b4-9ed6-6f13308a1d24?${params.toString()}`;

  // data.gov.in throttles automated/datacenter traffic, so a single request can
  // time out or return 429/5xx. Retry with exponential backoff and a hard
  // per-request timeout so one slow response can't hang the whole job.
  const MAX_ATTEMPTS = Number(process.env.DATA_GOV_MAX_RETRIES) || 4;
  const REQ_TIMEOUT = Number(process.env.DATA_GOV_TIMEOUT_MS) || 25000;
  let lastError = "request failed";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: API_CONFIG.headers,
        timeout: REQ_TIMEOUT,
      });
      return {
        success: true,
        data: response.data,
        count: response.data.records?.length || 0,
      };
    } catch (error) {
      const status = error.response && error.response.status;
      lastError = status
        ? `API error (${status})`
        : error.code || error.message || "request failed";
      // Retry on throttling (429), server errors (5xx), timeouts and transient
      // network errors. Don't retry a clear client error (e.g. 400/403).
      const retriable =
        !error.response ||
        status === 429 ||
        status >= 500 ||
        ["ECONNABORTED", "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN", "ENOTFOUND"].includes(error.code);

      if (attempt < MAX_ATTEMPTS && retriable) {
        const backoff = Math.min(1000 * 2 ** (attempt - 1), 8000); // 1s, 2s, 4s, 8s
        await sleep(backoff);
        continue;
      }
      console.error(`Error fetching daily prices (attempt ${attempt}/${MAX_ATTEMPTS}): ${lastError}`);
      return { success: false, error: lastError, data: null };
    }
  }

  return { success: false, error: lastError, data: null };
};
/**
 * Get today's date in DD-MM-YYYY format
 * @returns {string} Formatted date string
 */
const getTodayDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Fetch today's commodity prices
 * Convenience function to get today's prices
 * @param {Object} filters - Filter parameters (state, district, commodity)
 * @returns {Promise<Object>} API response with today's prices
 */
const fetchTodayPrices = async (filters = {}) => {
  const todayDate = getTodayDate();
  return await fetchDailyPrices({
    ...filters,
    arrivalDate: todayDate,
  });
};

/**
 * Fetch Live Market Data for Today
 * Get all commodities for a specific market on current date
 * @param {Object} marketInfo - Market information
 * @param {string} marketInfo.state - State name
 * @param {string} marketInfo.district - District name
 * @param {string} marketInfo.market - Market name
 * @param {number} limit - Number of records to fetch (default: 3000)
 * @returns {Promise<Object>} API response with today's market data
 */
const fetchLiveMarketData = async (marketInfo = {}, limit = 3000) => {
  try {
    const params = new URLSearchParams({
      "api-key": API_CONFIG.apiKey,
      format: "json",
      limit: limit.toString(),
    });

    // Add filters for specific market
    if (marketInfo.state) {
      params.append("filters[state.keyword]", marketInfo.state);
    }
    if (marketInfo.district) {
      params.append("filters[district]", marketInfo.district);
    }
    if (marketInfo.market) {
      params.append("filters[market]", marketInfo.market);
    }

    const url = `${API_CONFIG.baseURL}/9ef84268-d588-465a-a308-a864a43d0070?${params.toString()}`;

    const response = await axios.get(url, {
      headers: API_CONFIG.headers,
    });

    return {
      success: true,
      data: response.data,
      count: response.data.records?.length || 0,
      marketInfo,
    };
  } catch (error) {
    console.error("Error fetching live market data:", error.message);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

module.exports = {
  fetchHistoricalPrices,
  fetchDailyPrices,
  fetchPastDayPrices,
  fetchTodayPrices,
  fetchLiveMarketData,
  getTodayDate,
};
