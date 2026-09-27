const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const config = require("../config");

// NOTE: intentionally no top-level process.exit() here — a missing
// DATABASE_URL should degrade gracefully (server.js's start() already
// wraps migrations in a try/catch and just skips them with a warning),
// not kill the entire process before that safety net ever runs.
async function runMigrations() {
  if (!config.databaseUrl) {
    throw new Error('Missing DATABASE_URL in environment — skipping migrations.');
  }

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    await pool.end();
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      throw new Error(
        'Database host could not be resolved. Set SUPABASE_DB_URL to the connection string from Supabase Dashboard > Connect > Session pooler, then rerun the migration.'
      );
    }
    if (err.code === '28P01') {
      throw new Error(
        'Database password authentication failed. Reset the database password in Supabase Dashboard > Project Settings > Database, URL-encode special characters, update SUPABASE_DB_URL, and rerun the migration.'
      );
    }
    throw err;
  }

  try {
    await client.query("BEGIN");

    // 1. users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'fisherman',
        organization TEXT DEFAULT '',
        vessel_name TEXT DEFAULT '',
        preferred_sector TEXT DEFAULT 'Arabian Sea / Mumbai Coast',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Case-insensitive email index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email
      ON users (LOWER(email));
    `);

    // 3. updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE 'plpgsql';
    `);

    // 4. Trigger on users
    await client.query(`
      DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
    `);

    await client.query(`
      CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // 5. Row Level Security
    await client.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);

    await client.query(`DROP POLICY IF EXISTS "no_public_access" ON users;`);

    await client.query(`
      CREATE POLICY "no_public_access" ON users
      FOR ALL
      USING (false);
    `);

    await client.query("COMMIT");
    console.log("[Migration] ✅ users table, trigger, and RLS ready.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[Migration] ❌ Failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Seeds the demo user if it does not already exist.
 * Skips silently if user already present.
 */
async function seedDemoUser() {
  if (!config.databaseUrl) {
    throw new Error('Missing DATABASE_URL in environment — skipping demo user seed.');
  }

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const email = "demo@orca.marine";

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email],
    );

    if (existing.rows.length > 0) {
      console.log("[Seed] Demo user already exists — skipping.");
      return;
    }

    const passwordHash = bcrypt.hashSync("Password123!", 10);

    await pool.query(
      `INSERT INTO users
        (name, email, password_hash, role, organization, vessel_name, preferred_sector)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        "Captain Rajesh Kumar",
        email,
        passwordHash,
        "fisherman",
        "Western Coastal Fisheries Co-op",
        "Matsya Sagar IV (IND-MH-02-1984)",
        "Arabian Sea / Mumbai Coast",
      ],
    );

    console.log(
      "[Seed] ✅ Demo user created (demo@orca.marine / Password123!).",
    );
  } catch (err) {
    console.error("[Seed] ❌ Failed:", err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

module.exports = { runMigrations, seedDemoUser };
