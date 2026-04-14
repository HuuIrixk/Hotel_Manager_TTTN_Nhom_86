const Booking = require('../models/Booking')
const Room = require('../models/Room')
const { Op } = require('sequelize')
const Payment = require('../models/Payment');

async function validateBookingInput({ room_id, check_in, check_out, guests }) {
  const checkInDate = new Date(check_in)
  const checkOutDate = new Date(check_out)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    return { error: 'Ngày nhận phòng hoặc trả phòng không hợp lệ.' }
  }

  if (checkInDate >= checkOutDate) {
    return { error: 'Ngày check-out phải sau ngày check-in' }
  }

  if (checkInDate < today) {
    return { error: 'Ngày check-in không thể ở trong quá khứ' }
  }

  const room = await Room.findByPk(room_id)
  if (!room) {
    return { error: 'Không tìm thấy phòng' }
  }

  if (Number(guests || 1) > Number(room.capacity || 0)) {
    return { error: 'Số khách vượt quá sức chứa của phòng.' }
  }

  const existingBooking = await Booking.findOne({
    where: {
      room_id,
      status: { [Op.in]: ['pending', 'confirmed', 'completed'] },
      check_in: { [Op.lt]: checkOutDate },
      check_out: { [Op.gt]: checkInDate },
    },
  })

  if (existingBooking) {
    return { error: 'Phòng đã được đặt trong khoảng thời gian này.' }
  }

  return { room, checkInDate, checkOutDate }
}

exports.validateBooking = async (req, res) => {
  try {
    const validation = await validateBookingInput(req.body)

    if (validation.error) {
      return res.status(400).json({ error: validation.error })
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Lỗi server khi kiểm tra đặt phòng' })
  }
}


// Đặt phòng
exports.createBooking = async (req, res) => {
  try {
    const { room_id, check_in, check_out, note, guests } = req.body
    const user_id = req.user.id // Lấy từ middleware

    console.log('>>> createBooking body =', req.body, 'user =', req.user)

    const validation = await validateBookingInput({ room_id, check_in, check_out, guests })
    if (validation.error) {
      return res.status(400).json({ error: validation.error })
    }

    const { room, checkInDate, checkOutDate } = validation

    // 4. Tạo booking (status: 'pending')
    const booking = await Booking.create({
      user_id,
      room_id,
      check_in: checkInDate,
      check_out: checkOutDate,
      guests: Number(guests || 1),
      note: note ? String(note).trim() : null,
      status: 'pending',
    })

    // 5. Tính tổng tiền
    const nights =
      (checkOutDate.getTime() - checkInDate.getTime()) /
      (1000 * 60 * 60 * 24)
    const totalAmount = nights * parseFloat(room.price)

    // Lấy booking kèm thông tin phòng
    const bookingWithRoom = await Booking.findByPk(booking.booking_id, {
      include: [Room],
    })

    return res.status(201).json({
      message: 'Tạo đơn đặt phòng thành công. Chuyển sang thanh toán.',
      booking: bookingWithRoom,
      totalAmount,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Lỗi server khi đặt phòng' })
  }
}

// (Khách hàng) Xem lịch sử đặt phòng của mình
exports.getMyBookings = async (req, res) => {
  try {
    await Booking.update(
      { status: 'completed' },
      {
        where: {
          user_id: req.user.id,
          status: 'confirmed',
          check_out: { [Op.lt]: new Date() },
        },
      }
    )

    const stalePendingPayments = await Payment.findAll({
      where: {
        method: 'vnpay',
        status: 'pending',
      },
      include: [
        {
          model: Booking,
          required: true,
          where: {
            user_id: req.user.id,
            status: 'pending',
          },
        },
      ],
    })

    for (const payment of stalePendingPayments) {
      const booking = payment.Booking
      await payment.destroy()
      if (booking) {
        await booking.destroy()
      }
    }

    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Room },
        { model: Payment, required: false }, // có thể chưa thanh toán
      ],
      order: [
        ['created_at', 'DESC'],
        ['booking_id', 'DESC'],
      ],
    });

    return res.json(bookings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};


// (Khách hàng) Hủy 1 đơn đặt phòng
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: {
        booking_id: req.params.id,
        user_id: req.user.id,
      },
    })

    if (!booking) {
      return res.status(404).json({
        error: 'Không tìm thấy đơn đặt phòng hoặc bạn không có quyền',
      })
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        error: 'Chỉ có thể hủy đơn ở trạng thái chờ.',
      })
    }

    booking.status = 'cancelled'
    await booking.save()

    const bookingWithDetails = await Booking.findOne({
      where: {
        booking_id: booking.booking_id,
        user_id: req.user.id,
      },
      include: [
        { model: Room },
        { model: Payment, required: false },
      ],
    })

    return res.json({
      message: 'Hủy đặt phòng thành công',
      booking: bookingWithDetails || booking,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Lỗi server' })
  }
}
