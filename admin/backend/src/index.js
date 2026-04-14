const express = require('express');
const cors = require('cors');
const path = require('path');
const { env } = require('./config/env.js');
const { health } = require('./routes/health.js');
const { ensureRoomSchema } = require('./models/room.model');

const roomRoutes = require('./routes/room.routes.js');
const bookingRoutes = require("./routes/booking.routes");
const reviewRoutes = require("./routes/review.routes");
const userRoutes = require("./routes/user.routes");
const knowledgeRoutes = require("./routes/knowledge.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// Kiểm tra môi trường
console.log('--- Environment Check ---');
console.log('Server Port:', env.port);
console.log('Supabase URL:', env.supabaseUrl);
console.log('Supabase Key:', env.supabaseAnonKey ? ' Loaded' : ' Missing');
console.log('-------------------------');

app.use(health);
app.use("/api/auth", require("./routes/auth.routes"));

app.use('/api/admin/rooms', roomRoutes);
app.use("/api/admin/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/admin/kb", knowledgeRoutes);
app.use("/api/contact", require("./routes/contact.routes"));



// TODO: modules/rooms, modules/bookings, modules/payments (team tự cài đặt)

async function bootstrap() {
  try {
    await ensureRoomSchema();
    app.listen(env.port, () => {
      console.log(`[backend] running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to initialize admin backend:', error);
    process.exit(1);
  }
}

bootstrap();
