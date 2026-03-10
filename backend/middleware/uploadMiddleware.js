const multer = require("multer");

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const allowedMimeType = (mimeType) => {
  if (!mimeType) return false;
  if (/^image\//.test(mimeType)) return true;
  if (/^video\//.test(mimeType)) return true;
  if (/^audio\//.test(mimeType)) return true;
  if (/^text\//.test(mimeType)) return true;

  const allowList = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/json",
    "application/zip",
    "application/x-zip-compressed"
  ]);

  return allowList.has(mimeType);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeType(file.mimetype)) {
      return cb(new Error("Unsupported file type."));
    }
    cb(null, true);
  }
});

module.exports = upload;
