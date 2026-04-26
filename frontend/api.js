/**
 * api.js — Shared frontend API helper
 *
 * Include this script in every HTML page BEFORE page-specific scripts:
 *   <script src="../backend/api.js"></script>
 *
 * It exposes a global `API` object with typed fetch helpers for every
 * backend endpoint, so the HTML pages can load live data from Supabase
 * instead of showing static placeholder content.
 */

const API_BASE = "http://localhost:4000/api";

const API = {
  // ── Overview ─────────────────────────────────────────────
  async getOverview() {
    return _get("/overview");
  },

  // ── Fests ────────────────────────────────────────────────
  async getFests(params = {}) {
    return _get("/fests", params);
  },
  async getFest(id) {
    return _get(`/fests/${id}`);
  },
  async createFest(payload) {
    return _post("/fests", payload);
  },
  async updateFest(id, payload) {
    return _patch(`/fests/${id}`, payload);
  },

  // ── Merchants ────────────────────────────────────────────
  async getMerchants(params = {}) {
    return _get("/merchants", params);
  },
  async getMerchant(id) {
    return _get(`/merchants/${id}`);
  },
  async createMerchant(payload) {
    return _post("/merchants", payload);
  },

  // ── Transactions ─────────────────────────────────────────
  async getTransactions(params = {}) {
    return _get("/transactions", params);
  },
  async getTransactionStats() {
    return _get("/transactions/stats");
  },
  async createTransaction(payload) {
    return _post("/transactions", payload);
  },
  async updateTransactionStatus(id, status) {
    return _patch(`/transactions/${id}`, { status });
  },

  // ── Resolve Username (P2P) ───────────────────────────────
  async resolveUser(username) {
    return _get("/resolve-user", { username });
  },
};

// ── Internal helpers ─────────────────────────────────────────

async function _get(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "API error");
  }
  return res.json();
}

async function _post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "API error");
  }
  return res.json();
}

async function _patch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "API error");
  }
  return res.json();
}

// Make available globally in browser
if (typeof window !== "undefined") window.API = API;
// Also support Node require (tests)
if (typeof module !== "undefined") module.exports = API;
