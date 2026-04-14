const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');

// POST /api/contact — người dùng gửi tin nhắn (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    const msg = await ContactMessage.create({ name, email, message });
    res.status(201).json({ ok: true, data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
