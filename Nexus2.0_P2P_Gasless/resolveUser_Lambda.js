/**
 * resolveUser.js — Mock AWS Lambda Handler
 *
 * Simulates an AWS Lambda function backed by a DynamoDB "UsersTable".
 * In production this would use the AWS SDK DynamoDB.DocumentClient to
 * perform a GetItem call on the username as the partition key.
 *
 * Signature matches the real Lambda handler contract exactly so swapping
 * to a deployed function requires zero changes to the calling code.
 *
 * @param {{ queryStringParameters: { username: string } }} event  - API Gateway proxy event
 * @param {object} _context                                         - Lambda context (unused in mock)
 * @returns {Promise<{ statusCode: number, headers: object, body: string }>}
 */

// ─── Mock DynamoDB Table ──────────────────────────────────────────────────────
// Represents the "UsersTable" with username (PK) → walletAddress mapping.
// In production: replace with DynamoDB.DocumentClient.get() call.
const MOCK_DYNAMO_USERS_TABLE = {
  "@arya_chougule": {
    username:      "@arya_chougule",
    walletAddress: "0xABcDEF1234567890ABcDEF1234567890ABcDEF12",
    displayName:   "Arya Chougule",
    avatar:        "AC",
  },
  "@sakshi": {
    username:      "@sakshi",
    walletAddress: "0xDEaDBEeF5678901234DEaDBEeF5678901234DEaD",
    displayName:   "Sakshi Sharma",
    avatar:        "SS",
  },
  "@kartik": {
    username:      "@kartik",
    walletAddress: "0xBEEF90121234567890BEEF90121234567890BEEF",
    displayName:   "Kartik Bhatt",
    avatar:        "KB",
  },
  "@tanmay": {
    username:      "@tanmay",
    walletAddress: "0xCAFE34561234567890CAFE34561234567890CAFE",
    displayName:   "Tanmay Patel",
    avatar:        "TP",
  },
  "@priya_mehta": {
    username:      "@priya_mehta",
    walletAddress: "0xF00D1234567890ABcDEFF00D1234567890ABcDEF",
    displayName:   "Priya Mehta",
    avatar:        "PM",
  },
};

// ─── CORS Headers (matching real API Gateway Lambda Proxy output) ─────────────
const CORS_HEADERS = {
  "Content-Type":                "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// ─── Handler ──────────────────────────────────────────────────────────────────
async function handler(event, _context) {
  // ── Preflight (OPTIONS) ──────────────────────────────────────────────────
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  // ── Extract username from query params ───────────────────────────────────
  const rawUsername = event?.queryStringParameters?.username ?? "";
  const username    = rawUsername.trim().toLowerCase();

  if (!username) {
    return {
      statusCode: 400,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ error: "Missing required query param: username" }),
    };
  }

  // Normalise — allow callers to omit the leading @
  const key = username.startsWith("@") ? username : `@${username}`;

  console.log(`[resolveUser Lambda] 🔍 Looking up "${key}" in mock DynamoDB table...`);

  // ── Simulate ~50ms DynamoDB read latency ─────────────────────────────────
  await new Promise((r) => setTimeout(r, 50));

  const record = MOCK_DYNAMO_USERS_TABLE[key];

  if (!record) {
    console.log(`[resolveUser Lambda] ❌ User "${key}" not found.`);
    return {
      statusCode: 404,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ error: `User "${key}" not found.` }),
    };
  }

  console.log(`[resolveUser Lambda] ✔ Resolved "${key}" → ${record.walletAddress}`);

  return {
    statusCode: 200,
    headers:    CORS_HEADERS,
    body:       JSON.stringify(record),
  };
}

module.exports = { handler };
