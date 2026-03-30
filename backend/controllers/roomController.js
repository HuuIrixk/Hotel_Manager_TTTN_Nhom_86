// controllers/roomController.js
const { Op } = require('sequelize')
const Room = require('../models/Room')
const Booking = require('../models/Booking')

function parseDateFromQuery(str) {
  if (!str) return null;

  // Hỗ trợ dạng dd/mm hoặc dd/mm/yyyy
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2) {
      // vd: 27/11 -> dùng năm hiện tại
      const [d, m] = parts.map((x) => Number(x));
      if (!d || !m) return null;
      const year = new Date().getFullYear();
      return new Date(year, m - 1, d);
    }
    if (parts.length === 3) {
      const [d, m, y] = parts.map((x) => Number(x));
      if (!d || !m || !y) return null;
      return new Date(y, m - 1, d);
    }
    return null;
  }

  // Nếu là yyyy-mm-dd
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

exports.searchRooms = async (req, res) => {
  try {
    // log để debug FE gửi gì lên
    console.log('>>> searchRooms req.query =', req.query)

    let { type, minPrice, maxPrice, capacity, checkIn, checkOut } = req.query

    const whereRoom = {}

    if (type) {
      // nhớ: giá trị type phải khớp DB, ví dụ 'Standard', 'VIP', 'Suite'
      whereRoom.type = type
    }

    if (capacity) {
      whereRoom.capacity = { [Op.gte]: Number(capacity) }
    }

    if (minPrice) {
      whereRoom.price = {
        ...(whereRoom.price || {}),
        [Op.gte]: Number(minPrice),
      }
    }

    if (maxPrice) {
      whereRoom.price = {
        ...(whereRoom.price || {}),
        [Op.lte]: Number(maxPrice),
      }
    }

    // Lọc theo tình trạng: chỉ lấy phòng available
    whereRoom.status = 'available'

    // Nếu có checkIn/checkOut: loại phòng đã được đặt trùng
    if (checkIn && checkOut) {
      const inDate = parseDateFromQuery(checkIn)
      const outDate = parseDateFromQuery(checkOut)

      if (!inDate || !outDate) {
        return res
          .status(400)
          .json({ error: 'Ngày check-in/check-out không hợp lệ' })
      }

      if (outDate <= inDate) {
        return res
          .status(400)
          .json({ error: 'Ngày trả phòng phải sau ngày nhận phòng' })
      }

      const booked = await Booking.findAll({
        where: {
          status: { [Op.in]: ['confirmed', 'completed'] },
          check_in: { [Op.lt]: outDate },
          check_out: { [Op.gt]: inDate },
        },
        attributes: ['room_id'],
      });

      const bookedRoomIds = [...new Set(booked.map((b) => b.room_id))];

      if (bookedRoomIds.length > 0) {
        whereRoom.room_id = { [Op.notIn]: bookedRoomIds };
      }
    }

    console.log('>>> searchRooms whereRoom =', whereRoom)

    const rooms = await Room.findAll({
      where: whereRoom,
      order: [['price', 'ASC']],
    })

    console.log('>>> searchRooms rooms.length =', rooms.length)

    return res.json(rooms)
  } catch (err) {
    console.error('>>> searchRooms error:', err)
    return res.status(500).json({ error: 'Lỗi server khi tìm phòng' })
  }
}

exports.getRoomDetails = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id)

    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng' })
    }

    return res.json(room)
  } catch (err) {
    console.error('>>> getRoomDetails error:', err)
    return res.status(500).json({ error: 'Lỗi server khi lấy chi tiết phòng' })
  }
}

// DÙNG BOOKINGPAGE: lấy phòng theo "key" (ưu tiên số phòng, fallback sang id)
exports.getRoomByNumber = async (req, res) => {
  try {
    const { roomNumber } = req.params
    if (!roomNumber) {
      return res
        .status(400)
        .json({ error: 'Thiếu tham số roomNumber trong request.' })
    }

    // 1. Tìm theo room_number (string)
    let room = await Room.findOne({ where: { room_number: String(roomNumber) } });

    // 2. Nếu không thấy, thử tìm theo ID (nếu là số)
    if (!room && !Number.isNaN(Number(roomNumber))) {
       room = await Room.findByPk(Number(roomNumber));
    }

    if (!room) {
      return res
        .status(404)
        .json({ exists: false, error: 'Không tìm thấy phòng.' })
    }

    return res.json({
      exists: true,
      room_id: room.room_id,
      room_number: room.room_number,
      type: room.type,
      price: room.price,
      status: room.status,
      capacity: room.capacity,
      image_url: room.image_url,
      name: room.name,
    })
  } catch (err) {
    console.error('getRoomByNumber error:', err)
    return res.status(500).json({ error: 'Lỗi server.' })
  }
}

exports.getRecommendedRooms = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 6

    const whereRoom = {
      status: 'available',
    }

    const rooms = await Room.findAll({
      where: whereRoom,
      order: [['price', 'ASC']],
      limit,
    })

    return res.json(rooms)
  } catch (err) {
    console.error('>>> getRecommendedRooms error:', err)
    return res
      .status(500)
      .json({ error: 'Lỗi server khi gợi ý phòng' })
  }
}

exports.getRoomById = async (req, res) => {
  try {
    const roomId = Number(req.params.id)
    if (!roomId) {
      return res.status(400).json({ error: 'Thiếu roomId hợp lệ' })
    }

    const room = await Room.findByPk(roomId)

    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng.' })
    }

    return res.json({
      exists: true,
      room_id: room.room_id,
      room_number: room.room_number,
      type: room.type,
      price: room.price,
      status: room.status,
      capacity: room.capacity,
      image_url: room.image_url,
      name: room.name,
    })
  } catch (err) {
    console.error('getRoomById error:', err)
    return res.status(500).json({ error: 'Lỗi server.' })
  }
}
