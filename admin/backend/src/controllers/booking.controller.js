const Booking = require("../models/booking.model");
const Room = require("../models/room.model");
const User = require("../models/user.model");
const { Op } = require("sequelize");

const Payment = require("../models/payment.model");

// Lấy tất cả booking (Admin)
exports.getAll = async (req, res) => {
  try {
    const stalePendingBookings = await Booking.findAll({
      where: {
        status: "pending",
      },
      include: [
        {
          model: Payment,
          required: true,
          where: {
            method: "vnpay",
            status: "pending",
          },
        },
      ],
    });

    for (const booking of stalePendingBookings) {
      if (booking.Payment) {
        await booking.Payment.destroy();
      }
      await booking.destroy();
    }

    await Booking.update(
      { status: "completed" },
      {
        where: {
          status: "confirmed",
          check_out: { [Op.lt]: new Date() },
        },
      }
    );

    const bookings = await Booking.findAll({
      include: [
        { model: User, required: false },
        { model: Room, required: false },
        { model: Payment, required: false }
      ],
      order: [["booking_id", "DESC"]],
    });

    res.json(bookings);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy booking theo ID
exports.getById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { booking_id: req.params.id },
      include: [
        User,
        Room,
        { model: Payment, required: false }
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
    }

    res.json(booking);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin xác nhận đơn
exports.confirmBooking = async (req, res) => {
  try {
    const id = req.params.id;

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: "Không tìm thấy đơn" });

    // Kiểm tra xung đột lịch (chỉ block nếu đã có booking confirmed khác)
    const conflict = await Booking.findOne({
      where: {
        booking_id: { [Op.ne]: id },
        room_id: booking.room_id,
        status: "confirmed",
        check_in: { [Op.lt]: booking.check_out },
        check_out: { [Op.gt]: booking.check_in },
      },
    });

    if (conflict) {
      return res.status(400).json({ error: "Phòng đã hết, không thể xác nhận." });
    }

    // Xác nhận
    booking.status = "confirmed";
    await booking.save();

    res.json({
      message: "Xác nhận thành công",
      booking,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin hủy đơn
exports.cancelBooking = async (req, res) => {
  try {
    const id = req.params.id;

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({
      message: "Đã hủy đơn đặt phòng",
      booking,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin xóa đơn đặt phòng
exports.remove = async (req, res) => {
  try {
    const id = req.params.id;

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn" });
    }

    await booking.destroy();

    res.json({ message: "Xóa đơn đặt phòng thành công" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
