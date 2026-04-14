const express = require("express");
const ContactController = require("../controllers/contact.controller");
const auth = require("../middleware/authMiddleware");
const allow = require("../middleware/role.middleware");

const router = express.Router();

// Public: người dùng gửi tin nhắn
router.post("/", ContactController.create);

// Admin: xem danh sách
router.get("/", auth, allow("admin"), ContactController.getAll);

// Admin: đánh dấu đã đọc
router.put("/:id/read", auth, allow("admin"), ContactController.markRead);

// Admin: xóa
router.delete("/:id", auth, allow("admin"), ContactController.remove);

module.exports = router;
