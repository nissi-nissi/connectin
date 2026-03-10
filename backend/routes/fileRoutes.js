const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
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
} = require("../controllers/fileController");

const router = express.Router();

router.get("/shared/:token", getSharedFileByToken);
router.get("/shared/:token/download", downloadSharedFileByToken);

router.use(authMiddleware);

router.post("/upload", upload.single("file"), uploadFile);
router.get("/list", listFiles);
router.get("/stats", getDashboardStats); // new dashboard stats endpoint
router.get("/usage", getStorageUsage);
router.get("/metadata/:id", getFileMetadata);
router.get("/preview/:id", previewFile);
router.get("/download/:id", downloadFile);
router.delete("/delete/:id", deleteFile);
router.patch("/rename/:id", renameFile);
router.post("/move/:id", moveFile);
router.post("/share/:id", shareFile);

module.exports = router;
