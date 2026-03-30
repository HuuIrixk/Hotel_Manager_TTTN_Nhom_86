const express = require('express');
const RoomController = require('../controllers/room.controller');
const auth = require('../middleware/authMiddleware');
const allow = require('../middleware/role.middleware');

const multer = require('multer');           // NEW
const path = require('path');              // NEW
const fs = require('fs');                  // NEW

const router = express.Router();

// Cấu hình lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'rooms');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

// Public routes
router.get('/', RoomController.getAll);
router.get('/available', auth, allow('admin'), RoomController.getAvailable);
router.get('/:id', RoomController.getById);

// Admin routes
router.post(
  '/',
  auth,
  allow('admin'),
  upload.single('image'),               // nhận field 'image' khi create 
  RoomController.create
);

router.put(
  '/:id',
  auth,
  allow('admin'),
  upload.single('image'),               // nhận field 'image' khi update
  RoomController.update
);

router.delete('/:id', auth, allow('admin'), RoomController.remove);
router.patch('/:id/toggle', auth, allow('admin'), RoomController.toggleStatus);

module.exports = router;
