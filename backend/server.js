const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error("Missing required environment variables:", missingEnv.join(", "));
  process.exit(1);
}

const optionalAwsEnv = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_S3_BUCKET"
];
const missingAwsEnv = optionalAwsEnv.filter((key) => !process.env[key]);
if (missingAwsEnv.length) {
  console.warn(
    "Missing AWS S3 environment variables:",
    missingAwsEnv.join(", "),
    "- file operations will fail until configured."
  );
}

connectDB();

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);

      // Allow localhost dev across ports (Vite can run as 127.0.0.1 or localhost)
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many requests. Try again later." }
});

app.use("/auth", authRateLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/files", fileRoutes);
app.use("/folders", folderRoutes);

// Centralized error handler (no private details to client in prod)
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error("Unhandled error:", err);

  if (typeof err.message === "string" && err.message.startsWith("CORS blocked origin:")) {
    return res.status(403).json({ message: "CORS blocked origin." });
  }

  if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File exceeds max size of 100MB." });
  }

  if (err.code === "S3_NOT_CONFIGURED") {
    return res.status(503).json({ message: "File storage is not configured on the server." });
  }

  if (err.message === "Unsupported file type.") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
