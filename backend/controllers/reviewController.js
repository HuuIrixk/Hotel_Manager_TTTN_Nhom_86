const Review = require('../models/Review');
const User = require('../models/User');

// GET /api/reviews - Lấy tất cả review (public)
exports.getAll = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [{ model: User, attributes: ['username'], required: false }],
      order: [['created_at', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/reviews - Tạo review mới (cần đăng nhập)
exports.create = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || !comment?.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const review = await Review.create({
      user_id: userId,
      room_id: null,
      rating: Number(rating),
      comment: comment.trim(),
    });

    const full = await Review.findByPk(review.review_id, {
      include: [{ model: User, attributes: ['username'], required: false }],
    });

    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
