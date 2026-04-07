const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is not configured.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority"
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    if (mongoUri.startsWith("mongodb+srv://")) {
      console.error("If you're using MongoDB Atlas, ensure your IP is whitelisted in Network Access.");
    } else {
      console.error("If you're using local MongoDB, ensure the server is running and reachable.");
    }
    process.exit(1);
  }
};

module.exports = connectDB;
