const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // payload được set ở authController.login: { id, role }
    req.user = {
      id: payload.id,
      role: payload.role,
    };

    return next();
  } catch (err) {
    console.error('>>> authMiddleware verify error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
        errorCode: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      error: 'Token không hợp lệ.',
      errorCode: 'TOKEN_INVALID',
    });

  }
};
