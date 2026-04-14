const { Op } = require('sequelize');
const CartItem = require('../models/CartItem');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

async function validateCartPayload({
  room_id,
  check_in,
  check_out,
  guests,
  full_name,
  email,
  phone,
}) {
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!room_id || !check_in || !check_out || !full_name || !email || !phone) {
    return { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc trước khi thêm vào giỏ hàng.' };
  }

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    return { error: 'Ngày nhận phòng hoặc trả phòng không hợp lệ.' };
  }

  if (checkInDate >= checkOutDate) {
    return { error: 'Ngày trả phòng phải sau ngày nhận phòng.' };
  }

  if (checkInDate < today) {
    return { error: 'Ngày nhận phòng không thể ở trong quá khứ.' };
  }

  const room = await Room.findByPk(room_id);
  if (!room) {
    return { error: 'Không tìm thấy phòng.' };
  }

  const bookingConflict = await Booking.findOne({
    where: {
      room_id,
      status: { [Op.in]: ['pending', 'confirmed', 'completed'] },
      check_in: { [Op.lt]: checkOutDate },
      check_out: { [Op.gt]: checkInDate },
    },
  });

  if (bookingConflict) {
    return { error: 'Phòng đã được đặt trong khoảng thời gian này.' };
  }

  if (Number(guests || 1) > Number(room.capacity || 0)) {
    return { error: 'Số khách vượt quá sức chứa của phòng.' };
  }

  return { room, checkInDate, checkOutDate };
}

exports.addToCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const payload = req.body || {};

    const validation = await validateCartPayload(payload);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const { room, checkInDate, checkOutDate } = validation;

    const duplicated = await CartItem.findOne({
      where: {
        user_id,
        room_id: payload.room_id,
        check_in: checkInDate,
        check_out: checkOutDate,
      },
    });

    if (duplicated) {
      return res.status(400).json({ error: 'Phòng này đã tồn tại trong giỏ hàng với thời gian tương tự.' });
    }

    const cartItem = await CartItem.create({
      user_id,
      room_id: payload.room_id,
      check_in: checkInDate,
      check_out: checkOutDate,
      guests: Number(payload.guests || 1),
      full_name: String(payload.full_name || '').trim(),
      email: String(payload.email || '').trim(),
      phone: String(payload.phone || '').trim(),
      note: payload.note || null,
    });

    return res.status(201).json({
      message: 'Đã thêm phòng vào giỏ hàng.',
      cartItem,
      room,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server khi thêm vào giỏ hàng.' });
  }
};

exports.getMyCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const cartItems = await CartItem.findAll({
      where: { user_id },
      include: [{ model: Room }],
      order: [['created_at', 'DESC']],
    });

    return res.json(cartItems);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server khi lấy giỏ hàng.' });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const user_id = req.user.id;
    const cart_item_id = Number(req.params.id);

    const cartItem = await CartItem.findOne({
      where: { cart_item_id, user_id },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Không tìm thấy mục giỏ hàng.' });
    }

    await cartItem.destroy();
    return res.json({ message: 'Đã xóa phòng khỏi giỏ hàng.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server khi xóa khỏi giỏ hàng.' });
  }
};
