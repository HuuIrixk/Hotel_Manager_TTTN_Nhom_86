const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  addToCart,
  getMyCart,
  removeCartItem,
} = require('../controllers/cartController');

router.use(authMiddleware);

router.get('/items', getMyCart);
router.post('/items', addToCart);
router.delete('/items/:id', removeCartItem);

module.exports = router;
