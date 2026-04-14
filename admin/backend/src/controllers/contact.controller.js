const ContactMessage = require("../models/contact.model");

// Lấy tất cả tin nhắn liên hệ
exports.getAll = async (req, res) => {
  try {
    const messages = await ContactMessage.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Đánh dấu đã đọc
exports.markRead = async (req, res) => {
  try {
    const [updated] = await ContactMessage.update(
      { is_read: true },
      { where: { id: req.params.id } }
    );
    if (!updated) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    res.json({ message: "Đã đánh dấu đã đọc" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa tin nhắn
exports.remove = async (req, res) => {
  try {
    const deleted = await ContactMessage.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    res.json({ message: "Đã xóa tin nhắn" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo tin nhắn mới (từ trang liên hệ của user)
exports.create = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }
    const msg = await ContactMessage.create({ name, email, message });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
