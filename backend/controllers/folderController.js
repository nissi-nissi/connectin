const mongoose = require("mongoose");
const Folder = require("../models/Folder");
const File = require("../models/File");

const { Types } = mongoose;

const isObjectId = (id) => id && Types.ObjectId.isValid(id);

const normalizeFolderId = (folderId) => {
  if (!folderId || folderId === "root") return null;
  return folderId;
};

const createFolder = async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    const normalizedParentId = normalizeFolderId(parentFolderId);

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required." });
    }

    if (normalizedParentId) {
      if (!isObjectId(normalizedParentId)) {
        return res.status(400).json({ message: "Invalid parentFolderId." });
      }
      const parent = await Folder.findOne({ _id: normalizedParentId, userId: req.user.id });
      if (!parent) {
        return res.status(404).json({ message: "Parent folder not found." });
      }
    }

    const folder = await Folder.create({
      userId: req.user.id,
      name: name.trim(),
      parentFolderId: normalizedParentId
    });

    return res.status(201).json(folder);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A folder with this name already exists here." });
    }
    return res.status(500).json({ message: "Failed to create folder.", error: error.message });
  }
};

const listFolders = async (req, res) => {
  try {
    const { parentFolderId, all } = req.query;
    let query = { userId: req.user.id };

    if (all !== "true") {
      const normalizedParentId = normalizeFolderId(parentFolderId);
      if (normalizedParentId && !isObjectId(normalizedParentId)) {
        return res.status(400).json({ message: "Invalid parentFolderId." });
      }
      query.parentFolderId = normalizedParentId;
    }

    const folders = await Folder.find(query).sort({ name: 1, createdAt: -1 });
    return res.status(200).json(folders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch folders.", error: error.message });
  }
};

const deleteFolder = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid folder id." });
    }
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found." });
    }

    const [childFolderCount, childFileCount] = await Promise.all([
      Folder.countDocuments({ userId: req.user.id, parentFolderId: folder._id }),
      File.countDocuments({ userId: req.user.id, folderId: folder._id })
    ]);

    if (childFolderCount > 0 || childFileCount > 0) {
      return res.status(400).json({
        message: "Folder is not empty. Move or delete nested files/folders first."
      });
    }

    await folder.deleteOne();
    return res.status(200).json({ message: "Folder deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete folder.", error: error.message });
  }
};

// rename support for improved UI
const renameFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "New folder name is required." });
    }

    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid folder id." });
    }

    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found." });
    }

    folder.name = name.trim();
    await folder.save();
    return res.status(200).json(folder);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A folder with this name already exists here." });
    }
    return res.status(500).json({ message: "Failed to rename folder.", error: error.message });
  }
};

module.exports = { createFolder, listFolders, deleteFolder, renameFolder };
