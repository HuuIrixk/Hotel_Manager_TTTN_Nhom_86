const sequelize = require("../src/config/db");
const Booking = require("../src/models/booking.model");
const User = require("../src/models/user.model");
const Room = require("../src/models/room.model");
const Payment = require("../src/models/payment.model");

async function check() {
  try {
    await sequelize.authenticate();
    console.log("Connected.");

    const bookings = await Booking.findAll({
      include: [
        { model: User, required: false },
        { model: Room, required: false },
        { model: Payment, required: false }
      ],
      order: [["booking_id", "DESC"]],
    });

    console.log(`Found ${bookings.length} bookings.`);
    if (bookings.length > 0) {
      console.log("First booking:", JSON.stringify(bookings[0], null, 2));
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sequelize.close();
  }
}

check();
