const express = require('express')
const router = express.Router()

const {
  validateBooking,
  createBooking,
  getMyBookings,
  cancelBooking,
} = require('../controllers/bookingController')

const authMiddleware = require('../middleware/authMiddleware')

// require auth for all booking routes
router.use(authMiddleware)

// create booking
router.post('/validate', validateBooking)

// create booking
router.post('/', createBooking)

// get bookings of current user
router.get('/my-bookings', getMyBookings)

// cancel booking
router.put('/:id/cancel', cancelBooking)

module.exports = router
