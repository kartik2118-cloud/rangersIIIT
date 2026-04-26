/**
 * routes/overview.js — GET /api/overview
 * Returns aggregated stats for the Overview dashboard.
 * Falls back to rich mock data when Supabase is not configured.
 */

const express   = require("express");
const supabase  = require("../lib/supabaseClient");
const router    = express.Router();

// ── Rich demo data (used when Supabase is not connected) ─────
const DEMO = {
  totalRevenue:      24350,
  transactionsToday: 312,
  activeMerchants:   28,
  activeFests:       2,
  topMerchants: [
    { name: "Burger Bros",   revenue: 4250, txCount: 124 },
    { name: "Merch Tent A",  revenue: 3100, txCount: 86  },
    { name: "VIP Lounge Bar",revenue: 2840, txCount: 42  },
  ],
  recentTransactions: [
    { created_at: new Date(Date.now()-30*60000).toISOString(),  merchant_name:"Burger Bros",       fest_name:"Neon Nights", amount:15.00,  status:"success", tx_hash:"0x9d3...f1a2", student_wallet:"0x7F2...8a9B" },
    { created_at: new Date(Date.now()-60*60000).toISOString(),  merchant_name:"Merch Tent A",      fest_name:"Neon Nights", amount:45.50,  status:"pending", tx_hash:"0x3e2...c1f",  student_wallet:"0x3A1...c4D2" },
    { created_at: new Date(Date.now()-90*60000).toISOString(),  merchant_name:"VIP Lounge Bar",    fest_name:"Sonic Waves", amount:120.00, status:"success", tx_hash:"0x9a4...d5e",  student_wallet:"0x9B4...1eF5" },
    { created_at: new Date(Date.now()-120*60000).toISOString(), merchant_name:"Craft Beer Co",     fest_name:"Neon Nights", amount:24.00,  status:"failed",  tx_hash:"0x1b7...f8d",  student_wallet:"0x1C2...d5E4" },
    { created_at: new Date(Date.now()-150*60000).toISOString(), merchant_name:"Main Stage Drinks", fest_name:"TechHouse",   amount:22.50,  status:"success", tx_hash:"0x7e2...9b4a", student_wallet:"0x5D3...f6A1" },
  ],
};

router.get("/", async (_req, res, next) => {
  try {
    const { data: revenueData, error: revErr } = await supabase
      .from("transactions").select("amount").eq("status","success");

    // No Supabase connection → return demo data
    if (revErr || !revenueData || revenueData.length === 0) {
      return res.json(DEMO);
    }

    const totalRevenue = revenueData.reduce((s, r) => s + Number(r.amount), 0);

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const { count: transactionsToday } = await supabase
      .from("transactions").select("id", { count:"exact", head:true })
      .gte("created_at", todayStart.toISOString());

    const { data: amData } = await supabase
      .from("transactions").select("merchant_id").eq("status","success");
    const activeMerchants = new Set((amData||[]).map(r=>r.merchant_id)).size;

    const { count: activeFests } = await supabase
      .from("fests").select("id",{count:"exact",head:true}).eq("status","live");

    const { data: allTxs } = await supabase
      .from("transactions").select("merchant_id,merchant_name,amount").eq("status","success");
    const merchantMap = {};
    for (const tx of allTxs||[]) {
      if (!merchantMap[tx.merchant_id]) merchantMap[tx.merchant_id]={name:tx.merchant_name,revenue:0,txCount:0};
      merchantMap[tx.merchant_id].revenue  += Number(tx.amount);
      merchantMap[tx.merchant_id].txCount  += 1;
    }
    const topMerchants = Object.values(merchantMap).sort((a,b)=>b.revenue-a.revenue).slice(0,3);

    const { data: recentTransactions } = await supabase
      .from("transactions")
      .select("created_at,merchant_name,fest_name,amount,status,tx_hash,student_wallet")
      .order("created_at",{ascending:false}).limit(10);

    res.json({ totalRevenue, transactionsToday:transactionsToday??0, activeMerchants, activeFests:activeFests??0, topMerchants, recentTransactions });
  } catch (err) { next(err); }
});

module.exports = router;
