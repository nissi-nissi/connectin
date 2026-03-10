const path = require("path");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const File = require("../models/File");
const Folder = require("../models/Folder");
const Share = require("../models/Share");
const {
  uploadBufferToS3,
  deleteFromS3,
  getSignedDownloadUrl,
  getSignedViewUrl
} = require("../services/s3Service");

const normalizeFolderId = (folderId) => {
  if (!folderId || folderId === "root") return null;
  return folderId;
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required." });
    }

    const folderId = normalizeFolderId(req.body.folderId);
    if (folderId) {
      const folderExists = await Folder.exists({ _id: folderId, userId: req.user.id });
      if (!folderExists) {
        return res.status(404).json({ message: "Folder not found." });
      }
    }

    const extension = path.extname(req.file.originalname);
    const s3Key = `${req.user.id}/${uuidv4()}${extension}`;
    const s3Url = await uploadBufferToS3(req.file.buffer, s3Key, req.file.mimetype);

    const file = await File.create({
      userId: req.user.id,
      filename: req.file.originalname,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      s3Key,
      s3Url,
      folderId
    });

    return res.status(201).json(file);
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload file.", error: error.message });
  }
};

const listFiles = async (req, res) => {
  try {
    const { folderId, search } = req.query;
    const query = {
      userId: req.user.id,
      folderId: normalizeFolderId(folderId)
    };

    if (search && search.trim()) {
      query.filename = { $regex: search.trim(), $options: "i" };
    }

    const files = await File.find(query).sort({ createdAt: -1 });
    return res.status(200).json(files);
  } catch (error) {
    return res.status(500).json({ message: "Failed to list files.", error: error.message });
  }
};

const getStorageUsage = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const usage = await File.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } }
    ]);

    return res.status(200).json({
      usageBytes: usage[0]?.totalBytes || 0
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to calculate storage usage.", error: error.message });
  }
};

// new helper for dashboard metrics
const getDashboardStats = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    // storage usage, total files, total folders
    const [usageAgg] = await File.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } }
    ]);
    const totalFiles = await File.countDocuments({ userId: userObjectId });
    const totalFolders = await Folder.countDocuments({ userId: userObjectId });

    // top shared files for this user
    const topShared = await Share.aggregate([
      // join with files to ensure the share belongs to one of the user's files
      {
        $lookup: {
          from: "files",
          localField: "fileId",
          foreignField: "_id",
          as: "file"
        }
      },
      { $unwind: "$file" },
      { $match: { "file.userId": userObjectId } },
      {
        $group: {
          _id: "$fileId",
          count: { $sum: 1 },
          filename: { $first: "$file.filename" },
          originalName: { $first: "$file.originalName" },
          fileSize: { $first: "$file.fileSize" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    return res.status(200).json({
      usageBytes: usageAgg?.totalBytes || 0,
      totalFiles,
      totalFolders,
      topShared
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to gather dashboard stats.", error: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    const downloadUrl = await getSignedDownloadUrl(file.s3Key, file.originalName, 300);
    return res.status(200).json({ downloadUrl, filename: file.originalName });
  } catch (error) {
    return res.status(500).json({ message: "Failed to prepare download.", error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    await deleteFromS3(file.s3Key);
    await Share.deleteMany({ fileId: file._id });
    await file.deleteOne();

    return res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete file.", error: error.message });
  }
};

const renameFile = async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename || !filename.trim()) {
      return res.status(400).json({ message: "New filename is required." });
    }

    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    file.filename = filename.trim();
    await file.save();

    return res.status(200).json(file);
  } catch (error) {
    return res.status(500).json({ message: "Failed to rename file.", error: error.message });
  }
};

const moveFile = async (req, res) => {
  try {
    const destinationFolderId = normalizeFolderId(req.body.folderId);
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    if (destinationFolderId) {
      const folder = await Folder.findOne({ _id: destinationFolderId, userId: req.user.id });
      if (!folder) {
        return res.status(404).json({ message: "Destination folder not found." });
      }
    }

    file.folderId = destinationFolderId;
    await file.save();

    return res.status(200).json(file);
  } catch (error) {
    return res.status(500).json({ message: "Failed to move file.", error: error.message });
  }
};

const shareFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    const { expiresAt, expiresInHours } = req.body;
    let expiresDate = null;

    if (expiresAt) {
      expiresDate = new Date(expiresAt);
      if (Number.isNaN(expiresDate.getTime())) {
        return res.status(400).json({ message: "Invalid expiresAt value." });
      }
    } else if (expiresInHours && Number(expiresInHours) > 0) {
      expiresDate = new Date(Date.now() + Number(expiresInHours) * 60 * 60 * 1000);
    }

    const shareToken = uuidv4().replaceAll("-", "");
    const share = await Share.create({
      fileId: file._id,
      shareToken,
      expiresAt: expiresDate
    });

    const shareUrl = `${process.env.CLIENT_URL || process.env.FRONTEND_URL}/share/${shareToken}`;
    return res.status(201).json({
      shareToken: share.shareToken,
      shareUrl,
      expiresAt: share.expiresAt
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate share link.", error: error.message });
  }
};

const getFileMetadata = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id })
      .populate("folderId", "name")
      .lean();
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    return res.status(200).json(file);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch metadata.", error: error.message });
  }
};

const previewFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    const previewUrl = await getSignedViewUrl(file.s3Key, 600);
    return res.status(200).json({
      id: file._id,
      filename: file.filename,
      mimeType: file.mimeType,
      previewUrl
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate preview URL.", error: error.message });
  }
};

const getSharedFileByToken = async (req, res) => {
  try {
    const share = await Share.findOne({ shareToken: req.params.token }).populate("fileId");
    if (!share || !share.fileId) {
      return res.status(404).json({ message: "Shared file not found." });
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      return res.status(410).json({ message: "This share link has expired." });
    }

    const file = share.fileId;
    const previewUrl = await getSignedViewUrl(file.s3Key, 600);
    return res.status(200).json({
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      previewUrl
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch shared file.", error: error.message });
  }
};

const downloadSharedFileByToken = async (req, res) => {
  try {
    const share = await Share.findOne({ shareToken: req.params.token }).populate("fileId");
    if (!share || !share.fileId) {
      return res.status(404).json({ message: "Shared file not found." });
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      return res.status(410).json({ message: "This share link has expired." });
    }

    const file = share.fileId;
    const downloadUrl = await getSignedDownloadUrl(file.s3Key, file.originalName, 300);
    return res.status(200).json({
      filename: file.originalName,
      downloadUrl
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to prepare shared download.", error: error.message });
  }
};

module.exports = {
  uploadFile,
  listFiles,
  getStorageUsage,
  getDashboardStats,
  downloadFile,
  deleteFile,
  renameFile,
  moveFile,
  shareFile,
  getFileMetadata,
  previewFile,
  getSharedFileByToken,
  downloadSharedFileByToken
};
