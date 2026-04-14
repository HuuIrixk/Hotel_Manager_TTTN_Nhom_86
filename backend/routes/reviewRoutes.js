const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getAll, create } = require('../controllers/reviewController');

router.get('/', getAll);
router.post('/', authMiddleware, create);

module.exports = router;
