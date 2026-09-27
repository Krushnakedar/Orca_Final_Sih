require("dotenv").config();
const { runMigrations, seedDemoUser } = require("../src/db/migrate");

(async () => {
  try {
    await runMigrations();
    await seedDemoUser();
    console.log("✅ DB check passed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ DB check failed:", err.message);
    if (err.message.includes("password authentication failed")) {
      console.error("   Reset the database password in Supabase Dashboard > Project Settings > Database, then update SUPABASE_DB_URL.");
    } else {
      console.error("   Configure SUPABASE_DB_URL with the Supabase Dashboard > Connect > Session pooler string.");
    }
    process.exit(1);
  }
})();
