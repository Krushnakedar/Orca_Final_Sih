const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");
const routes = require("./routes");
const notFoundHandler = require("./middleware/notFoundHandler");
const errorHandler = require("./middleware/errorHandler");

const { apiLimiter, aiLimiter } = require("./middleware/rateLimiter");
const { sanitizeInputs } = require("./middleware/validation.middleware");

const app = express();

app.use(helmet());

const allowedOrigins = [
  config.clientUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Mitigate JSON flood and payload bloat DoS
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));

if (config.env !== "test") {
  app.use(morgan("dev"));
}

// Global input sanitization against null bytes and control chars
app.use("/api", sanitizeInputs);

// AI & Agent Rate Limiter (expensive LLM DAG computations)
app.use("/api/chat", aiLimiter);
app.use("/api/agents", aiLimiter);

// General API Rate Limiter
app.use("/api", apiLimiter);

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
