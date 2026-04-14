// backend/index.js
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const sequelize = require('./config/db')
const path = require('path');

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '..', 'admin', 'backend', 'uploads')))

console.log('>>> index.js loaded')

// Models & associations
const User = require('./models/User')
const Room = require('./models/Room')
const Booking = require('./models/Booking')
const Review = require('./models/Review')
const Payment = require('./models/Payment')
const CartItem = require('./models/CartItem')

// Associations
User.hasMany(Booking, { foreignKey: 'user_id' })
Booking.belongsTo(User, { foreignKey: 'user_id' })

Room.hasMany(Booking, { foreignKey: 'room_id' })
Booking.belongsTo(Room, { foreignKey: 'room_id' })

Room.hasMany(Review, { foreignKey: 'room_id' })
Review.belongsTo(Room, { foreignKey: 'room_id' })

User.hasMany(Review, { foreignKey: 'user_id' })
Review.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(Payment, { foreignKey: 'user_id' })
Payment.belongsTo(User, { foreignKey: 'user_id' })

Booking.hasOne(Payment, { foreignKey: 'booking_id' })
Payment.belongsTo(Booking, { foreignKey: 'booking_id' })

User.hasMany(CartItem, { foreignKey: 'user_id' })
CartItem.belongsTo(User, { foreignKey: 'user_id' })

Room.hasMany(CartItem, { foreignKey: 'room_id' })
CartItem.belongsTo(Room, { foreignKey: 'room_id' })

// Routes
const authRoutes = require('./routes/authRoutes')
const roomRoutes = require('./routes/roomRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const contactRoutes = require('./routes/contactRoutes')
const cartRoutes = require('./routes/cartRoutes')

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/contact', contactRoutes)

// Test root
app.get('/', (req, res) => {
  res.send('Backend OK')
})

// Kết nối DB
sequelize
  .authenticate()
  .then(() => {
    console.log('Kết nối Supabase PostgreSQL thành công')
    // Đã dùng migrations thay vì sync
  })
  .then(() => {
    console.log('Migrations đã được áp dụng.')
  })
  .catch((err) => console.error('Lỗi DB:', err))

// Start server
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`)
})
