const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  parentFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

folderSchema.index({ userId: 1, parentFolderId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Folder", folderSchema);
