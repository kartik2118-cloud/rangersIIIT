/**
 * routes/fests.js — Supabase-backed with demo fallback
 */
const express  = require("express");
const supabase = require("../lib/supabaseClient");
const router   = express.Router();

const DEMO_FESTS = [
  { id:"f1", name:"Neon Nights Music Festival", location:"Austin, TX",    start_date:"2024-10-12", end_date:"2024-10-14", status:"live",     merchantCount:124, transactionCount:42500, revenue:845000 },
  { id:"f2", name:"Winter Brew Fest 2024",       location:"Denver, CO",    start_date:"2024-12-05", end_date:"2024-12-07", status:"upcoming", merchantCount:85,  transactionCount:0,     revenue:120000 },
  { id:"f3", name:"Summer Solstice",             location:"Miami, FL",     start_date:"2024-06-20", end_date:"2024-06-22", status:"ended",    merchantCount:210, transactionCount:28000, revenue:580000 },
  { id:"f4", name:"TechHouse Fest",              location:"San Francisco, CA", start_date:"2024-09-01", end_date:"2024-09-03", status:"ended", merchantCount:67, transactionCount:12400, revenue:245000 },
];

router.get("/", async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabase.from("fests").select("*, merchants(count), transactions(count, amount)").order("start_date",{ascending:false});
    if (status) query = query.eq("status", status);
    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      const filtered = status ? DEMO_FESTS.filter(f=>f.status===status) : DEMO_FESTS;
      return res.json(filtered);
    }
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const demo = DEMO_FESTS.find(f=>f.id===req.params.id);
    const { data, error } = await supabase.from("fests").select("*").eq("id",req.params.id).single();
    if (error || !data) return res.json(demo || { error:"Fest not found" });
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, location, start_date, end_date, organizer_id, token_addr } = req.body;
    if (!name || !start_date || !end_date)
      return res.status(400).json({ error:"name, start_date, end_date are required." });
    const { data, error } = await supabase.from("fests")
      .insert([{ name, location, start_date, end_date, organizer_id, token_addr, status:"upcoming" }])
      .select().single();
    if (error) return res.status(201).json({ id:`f${Date.now()}`, name, location, start_date, end_date, status:"upcoming", merchantCount:0, revenue:0 });
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const allowed = ["name","location","start_date","end_date","status","token_addr"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k])=>allowed.includes(k)));
    const { data, error } = await supabase.from("fests").update(updates).eq("id",req.params.id).select().single();
    if (error) return res.json({ ...updates, id:req.params.id });
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
