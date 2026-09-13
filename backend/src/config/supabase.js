const { createClient } = require("@supabase/supabase-js");
const config = require("./index");

// Service-role client — server-side only. Never expose to browser.
const supabase = config.supabaseUrl && config.supabaseServiceRoleKey
  ? createClient(
      config.supabaseUrl,
      config.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  : {
      from() {
        throw new Error("Supabase is not configured.");
      },
    };

module.exports = supabase;
