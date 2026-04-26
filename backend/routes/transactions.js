/**
 * routes/transactions.js — Supabase-backed with demo fallback
 */
const express  = require("express");
const supabase = require("../lib/supabaseClient");
const router   = express.Router();

const DEMO_TXS = [
  { id:"t1", created_at:new Date(Date.now()-30*60000).toISOString(),  student_wallet:"0x7F2...8a9B", merchant_name:"Neon Burger Stand", fest_name:"Neon Nights",  amount:15.00,  status:"success", tx_hash:"0x9d3...f1a2" },
  { id:"t2", created_at:new Date(Date.now()-60*60000).toISOString(),  student_wallet:"0x3A1...c4D2", merchant_name:"Cyber Merch Tent",  fest_name:"TechHouse",    amount:45.00,  status:"success", tx_hash:"0x2b1...e45c" },
  { id:"t3", created_at:new Date(Date.now()-90*60000).toISOString(),  student_wallet:"0x9B4...1eF5", merchant_name:"VIP Lounge Bar",   fest_name:"Neon Nights",  amount:120.00, status:"pending", tx_hash:"0x5c4...8a1b" },
  { id:"t4", created_at:new Date(Date.now()-120*60000).toISOString(), student_wallet:"0x1C2...d5E4", merchant_name:"Glow Sticks & More",fest_name:"Neon Nights", amount:8.00,   status:"failed",  tx_hash:"0x1a8...3c2d" },
  { id:"t5", created_at:new Date(Date.now()-150*60000).toISOString(), student_wallet:"0x5D3...f6A1", merchant_name:"Main Stage Drinks", fest_name:"TechHouse",   amount:22.50,  status:"success", tx_hash:"0x7e2...9b4a" },
];

router.get("/stats", async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from("transactions").select("amount,status,fest_id");
    if (error || !data || data.length===0)
      return res.json({ totalVolume:2450000, txCount:14239, activeFests:3 });
    const totalVolume = data.filter(t=>t.status==="success").reduce((s,t)=>s+Number(t.amount),0);
    res.json({ totalVolume, txCount:data.length, activeFests:new Set(data.map(t=>t.fest_id)).size });
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const { fest_id, status, search, page=1, limit=20 } = req.query;
    let demo = [...DEMO_TXS];
    if (fest_id) demo = demo.filter(t=>t.fest_id===fest_id);
    if (status)  demo = demo.filter(t=>t.status===status);
    if (search)  demo = demo.filter(t=>t.merchant_name.toLowerCase().includes(search.toLowerCase())||t.student_wallet.toLowerCase().includes(search.toLowerCase()));

    const from=(Number(page)-1)*Number(limit), to=from+Number(limit)-1;
    let query = supabase.from("transactions").select("*",{count:"exact"}).order("created_at",{ascending:false}).range(from,to);
    if (fest_id) query=query.eq("fest_id",fest_id);
    if (status)  query=query.eq("status",status);
    if (search)  query=query.or(`merchant_name.ilike.%${search}%,student_wallet.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error || !data || data.length===0)
      return res.json({ transactions:demo, total:demo.length, page:Number(page), limit:Number(limit) });
    res.json({ transactions:data, total:count, page:Number(page), limit:Number(limit) });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { fest_id, merchant_id, merchant_name, fest_name, student_wallet, amount, tx_hash, status } = req.body;
    if (!student_wallet||!amount||!tx_hash)
      return res.status(400).json({ error:"student_wallet, amount, tx_hash are required." });
    const { data, error } = await supabase.from("transactions")
      .insert([{ fest_id,merchant_id,merchant_name,fest_name,student_wallet,amount,tx_hash,status:status??"pending" }]).select().single();
    if (error) return res.status(201).json({ id:`t${Date.now()}`,student_wallet,amount,tx_hash,status:status??"pending",created_at:new Date().toISOString() });
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["success","pending","failed"].includes(status))
      return res.status(400).json({ error:"status must be success|pending|failed" });
    const { data, error } = await supabase.from("transactions").update({status}).eq("id",req.params.id).select().single();
    if (error) return res.json({ id:req.params.id, status });
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
