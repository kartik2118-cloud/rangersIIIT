/**
 * routes/merchants.js — Supabase-backed with demo fallback
 */
const express  = require("express");
const supabase = require("../lib/supabaseClient");
const router   = express.Router();

const DEMO_MERCHANTS = [
  { id:"m1", fest_id:"f1", festName:"Neon Nights 2024",   name:"Bite Me Burger",    category:"Food & Bev",   wallet_addr:"0x71C7656EC7ab88b098defB751B7401B5f6d8976F", revenue:12400, transactionCount:842, joined_at:"2023-10-01T00:00:00Z" },
  { id:"m2", fest_id:"f1", festName:"Neon Nights 2024",   name:"Neon Threads",      category:"Merchandise",  wallet_addr:"0x8B3a350cf5c34c9194ca85829a2df0ec3153be0", revenue:5800,  transactionCount:156, joined_at:"2024-01-01T00:00:00Z" },
  { id:"m3", fest_id:"f3", festName:"Summer Solstice",    name:"Thirst Trap",       category:"Food & Bev",   wallet_addr:"0x9F213c5dB81a81E0e47F6d8ba5f4F0e5dF3D100", revenue:18200, transactionCount:1204,joined_at:"2023-03-01T00:00:00Z" },
  { id:"m4", fest_id:"f1", festName:"Neon Nights 2024",   name:"Burger Bros",       category:"Food & Bev",   wallet_addr:"0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B", revenue:4250,  transactionCount:124, joined_at:"2024-02-01T00:00:00Z" },
  { id:"m5", fest_id:"f4", festName:"TechHouse Fest",     name:"Cyber Merch Tent",  category:"Merchandise",  wallet_addr:"0xDEaDBEeF5678901234DEaDBEeF5678901234DEaD", revenue:9100,  transactionCount:340, joined_at:"2024-03-01T00:00:00Z" },
  { id:"m6", fest_id:"f4", festName:"TechHouse Fest",     name:"Main Stage Drinks", category:"Food & Bev",   wallet_addr:"0xBEEF90121234567890BEEF90121234567890BEEF", revenue:6600,  transactionCount:290, joined_at:"2024-04-01T00:00:00Z" },
];

router.get("/", async (req, res, next) => {
  try {
    const { fest_id, category, search } = req.query;
    let demo = [...DEMO_MERCHANTS];
    if (fest_id)  demo = demo.filter(m=>m.fest_id===fest_id);
    if (category) demo = demo.filter(m=>m.category===category);
    if (search)   demo = demo.filter(m=>m.name.toLowerCase().includes(search.toLowerCase()));

    const { data, error } = await supabase.from("merchants")
      .select("*, fests(name), transactions(amount, status)").order("joined_at",{ascending:false});
    if (error || !data || data.length===0) return res.json(demo);
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const demo = DEMO_MERCHANTS.find(m=>m.id===req.params.id);
    const { data, error } = await supabase.from("merchants").select("*, fests(name)").eq("id",req.params.id).single();
    if (error || !data) return res.json(demo || { error:"Merchant not found" });
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { fest_id, name, category, wallet_addr } = req.body;
    if (!fest_id || !name || !wallet_addr)
      return res.status(400).json({ error:"fest_id, name, and wallet_addr are required." });
    const { data, error } = await supabase.from("merchants")
      .insert([{ fest_id, name, category, wallet_addr }]).select().single();
    if (error) return res.status(201).json({ id:`m${Date.now()}`, fest_id, name, category, wallet_addr, revenue:0, transactionCount:0 });
    res.status(201).json(data);
  } catch (err) { next(err); }
});

module.exports = router;
