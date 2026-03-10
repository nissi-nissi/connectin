require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/files", fileRoutes);
app.use("/folders", folderRoutes);

app.use((err, req, res, next) => {
  if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File exceeds max size of 100MB." });
  }
  if (err.message === "Unsupported file type.") {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: "Unexpected server error.", error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
