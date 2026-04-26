/**
 * supabaseClient.js
 * Singleton Supabase client — import this everywhere instead of
 * creating a new client per file.
 *
 * Env vars (add to backend/.env):
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY=your-anon-key
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[Supabase] ⚠️  SUPABASE_URL or SUPABASE_ANON_KEY missing — " +
    "running in DEMO mode (Supabase routes will return empty data). " +
    "Add credentials to backend/.env to enable live data."
  );
  // Return a stub so the server boots without crashing
    module.exports = {
      from: () => {
        const chainable = {
          select:  function() { return this; },
          insert:  function() { return this; },
          update:  function() { return this; },
          eq:      function() { return this; },
          ilike:   function() { return this; },
          gte:     function() { return this; },
          order:   function() { return this; },
          range:   function() { return this; },
          single:  function() { return this; },
          or:      function() { return this; },
          // Awaitable promise interface
          then: function(resolve) {
            resolve({ data: [], error: { message: "No Supabase credentials" } });
          }
        };
        return chainable;
      },
    };
    return;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("[Supabase] ✔ Client initialised →", SUPABASE_URL);

module.exports = supabase;
