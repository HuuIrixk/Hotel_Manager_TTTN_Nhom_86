const { Op } = require('sequelize');
const Room = require('../models/room.model');
const Booking = require('../models/booking.model');

function normalizeAmenities(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(trimmedValue);
      if (Array.isArray(parsedValue)) {
        return parsedValue.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch (error) {
      return trimmedValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function mapRoomResponse(room) {
  if (!room) {
    return room;
  }

  const plainRoom = typeof room.toJSON === 'function' ? room.toJSON() : room;
  return {
    ...plainRoom,
    amenities: normalizeAmenities(plainRoom.amenities),
  };
}

// Lấy tất cả phòng
exports.getAll = async (req, res) => {
  try {
    console.log('RoomController.getAll called');
    const rooms = await Room.findAll();
    console.log('Rooms found:', rooms.length);
    res.json(rooms.map(mapRoomResponse));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy chi tiết 1 phòng
exports.getById = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(mapRoomResponse(room));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo phòng
exports.create = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.amenities = normalizeAmenities(payload.amenities);

    if (req.file) {
      // lưu relative path
      payload.image_url = `/uploads/rooms/${req.file.filename}`;
    }

    const newRoom = await Room.create(payload);
    res.status(201).json(mapRoomResponse(newRoom));
  } catch (err) {
    console.error('Room.create error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật phòng
exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.amenities = normalizeAmenities(payload.amenities);

    if (req.file) {
      payload.image_url = `/uploads/rooms/${req.file.filename}`;
    }

    const [updated] = await Room.update(payload, {
      where: { room_id: req.params.id },
    });

    if (!updated) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error('Room.update error:', err);
    res.status(500).json({ error: err.message });
  }
};


// Xóa phòng
exports.remove = async (req, res) => {
  try {
    const deleted = await Room.destroy({ where: { room_id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle room status (available <-> maintenance)
exports.toggleStatus = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const newStatus = room.status === 'available' ? 'maintenance' : 'available';
    room.status = newStatus;
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get available rooms for a date range
exports.getAvailable = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const occupied = await Booking.findAll({
      attributes: ['room_id'],
      where: {
        status: { [Op.ne]: 'cancelled' },
        [Op.or]: [
          { check_in: { [Op.between]: [fromDate, toDate] } },
          { check_out: { [Op.between]: [fromDate, toDate] } },
          { check_in: { [Op.lte]: fromDate }, check_out: { [Op.gte]: toDate } },
        ],
      },
    });
    const occupiedIds = occupied.map(o => o.room_id);
    const rooms = await Room.findAll({ where: { room_id: { [Op.notIn]: occupiedIds } } });
    res.json(rooms.map(mapRoomResponse));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
