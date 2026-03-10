const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  s3Key: {
    type: String,
    required: true,
    unique: true
  },
  s3Url: {
    type: String,
    required: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

fileSchema.index({ userId: 1, folderId: 1, filename: 1 });

module.exports = mongoose.model("File", fileSchema);
