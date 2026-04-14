const Review = require("../models/review.model");
const User = require("../models/user.model");

Review.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Lấy danh sách tất cả review
exports.getAll = async (req, res) => {
  try {
    const list = await Review.findAll({
      include: [{ model: User, as: "user", attributes: ["username"] }],
      order: [["created_at", "DESC"]],
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy chi tiết 1 review theo ID
exports.getById = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo review mới (admin thêm hoặc user thêm)
exports.create = async (req, res) => {
  try {
    const data = {
      user_id: req.body.user_id,
      room_id: req.body.room_id,
      rating: req.body.rating,
      comment: req.body.comment,
      status: "pending", // chờ duyệt
    };

    const review = await Review.create(data);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin duyệt bình luận
exports.approve = async (req, res) => {
  try {
    const [updated] = await Review.update(
      { status: "approved" },
      { where: { review_id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    res.json({ message: "Đã duyệt bình luận" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin ẩn bình luận
exports.hide = async (req, res) => {
  try {
    const [updated] = await Review.update(
      { status: "hidden" },
      { where: { review_id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    res.json({ message: "Đã ẩn bình luận" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa bình luận
exports.remove = async (req, res) => {
  try {
    const deleted = await Review.destroy({
      where: { review_id: req.params.id },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }

    res.json({ message: "Đã xóa bình luận" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
