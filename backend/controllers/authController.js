const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

// Helper hash mật khẩu
async function setUserPassword(user, plainPassword) {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(plainPassword, salt);
  user.password = hashed;
  await user.save();
}

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp' });
    }

    // Kiểm tra email trùng
    const exist = await User.findOne({ where: { email } });
    if (exist) return res.status(400).json({ error: 'Email đã tồn tại' });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      phone: phone || null,
      password: hashed,
    });

    return res.status(201).json({
      message: 'Đăng ký thành công!',
      user: {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
};


// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Email không tồn tại' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Sai mật khẩu' });

    const token = jwt.sign(
      { id: Number(user.user_id), role: user.role || 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '24h' }
    );

    return res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: String(user.user_id),
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role || 'customer',
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
};


// Đổi mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ các trường' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải dài >= 6 ký tự' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu mới và xác nhận không khớp' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });

    await setUserPassword(user, newPassword);

    return res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server khi đổi mật khẩu' });
  }
};

// Quên mật khẩu — gửi token reset (nếu chưa cấu hình mail, trả về URL trong response)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Vui lòng cung cấp email' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Email không tồn tại' });

    // Tạo token reset (JWT ngắn hạn)
    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontend}/reset-password?token=${token}`;

    // TODO: Gửi email thực tế bằng mailer (nodemailer, external service). Hiện tại log và trả về URL để dev/test.
    console.info(`Password reset URL for ${email}: ${resetUrl}`);

    res.json({ message: 'Đã tạo token reset. Kiểm tra email (nếu mailer được cấu hình).', resetUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi xử lý quên mật khẩu' });
  }
};

// Reset mật khẩu bằng token
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token) return res.status(400).json({ error: 'Token reset bắt buộc' });
    if (!password) return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu mới' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findOne({ where: { user_id: payload.id } });
    if (!user) return res.status(404).json({ error: 'Người dùng không tồn tại' });

    const hashed = await bcrypt.hash(password, 10);
    await user.update({ password: hashed });

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi reset mật khẩu' });
  }
};

// Lấy profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['user_id', 'username', 'email', 'phone', 'created_at']
    });

    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server khi lấy profile' });
  }
};


// Cập nhật profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, phone } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });

    if (email && email !== user.email) {
      const existed = await User.findOne({ where: { email } });
      if (existed) return res.status(400).json({ error: 'Email này đã được sử dụng' });
      user.email = email;
    }

    if (username) user.username = username;
    if (typeof phone !== 'undefined') user.phone = phone;

    await user.save();

    return res.json({
      message: 'Cập nhật hồ sơ thành công',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server khi cập nhật hồ sơ' });
  }
};
