const mongoose = require("mongoose");

const connectDB = async () => {
  const connectWithUri = async (uri) => {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority"
    });
  };

  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not configured.");
    }

    try {
      await connectWithUri(mongoUri);
      console.log("MongoDB connected successfully");
      return;
    } catch (primaryError) {
      const isDev = process.env.NODE_ENV !== "production";
      const isAtlas = mongoUri.startsWith("mongodb+srv://");

      if (isDev && isAtlas) {
        const fallbackUri =
          process.env.MONGO_URI_FALLBACK || "mongodb://127.0.0.1:27017/cloud_drive";
        console.warn(
          "MongoDB primary connection failed. Trying fallback MONGO_URI_FALLBACK/local MongoDB..."
        );
        await connectWithUri(fallbackUri);
        console.log("MongoDB connected successfully (fallback)");
        return;
      }

      throw primaryError;
    }
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    const mongoUri = process.env.MONGO_URI || "";
    if (mongoUri.startsWith("mongodb+srv://")) {
      console.error("If you're using MongoDB Atlas, ensure your IP is whitelisted in Network Access.");
    } else {
      console.error("If you're using local MongoDB, ensure the server is running and reachable.");
    }
    console.error("Continuing without database connection...");
    // process.exit(1);
  }
};

module.exports = connectDB;
