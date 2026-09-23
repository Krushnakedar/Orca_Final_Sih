require("dotenv").config();

const configuredDatabaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const databaseUrl = configuredDatabaseUrl && !/[<>]/.test(configuredDatabaseUrl)
  ? configuredDatabaseUrl
  : process.env.DATABASE_URL;

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[SECURITY CRITICAL] JWT_SECRET environment variable is missing in production! System must be secured with a robust secret.",
    );
  } else if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[SECURITY NOTICE] JWT_SECRET is not explicitly set; utilizing local development fallback secret.",
    );
  }
}

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  apiVersion: "v1.0.0",
  jwtSecret:
    process.env.JWT_SECRET || "orca_marine_jwt_default_secret_key_2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  // Prefer the explicit Supabase pooler URL when provided. The direct
  // db.<project>.supabase.co host is not available for every project/network.
  databaseUrl,
  pfz: {
    timeoutMs: parseInt(process.env.PFZ_TIMEOUT_MS, 10) || 4000,
    sstSource: process.env.PFZ_SST_SOURCE || "open-meteo",
    chlorophyllSource: process.env.PFZ_CHLOROPHYLL_SOURCE || "baseline",
    fallbackEnabled: process.env.PFZ_FALLBACK_ENABLED !== "false",
  },
  incois: {
    baseUrl:
      process.env.INCOIS_ERDDAP_URL || "https://erddap.incois.gov.in/erddap",
    timeoutMs: parseInt(process.env.INCOIS_TIMEOUT_MS, 10) || 4000,
    fallbackEnabled: process.env.INCOIS_FALLBACK_ENABLED !== "false",
  },
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
};
