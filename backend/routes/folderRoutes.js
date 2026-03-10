const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { createFolder, listFolders, deleteFolder, renameFolder } = require("../controllers/folderController");

const router = express.Router();

router.use(authMiddleware);

router.post("/create", createFolder);
router.patch("/rename/:id", renameFolder); // new route for folder rename
router.get("/list", listFolders);
router.delete("/delete/:id", deleteFolder);

module.exports = router;
