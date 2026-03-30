const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function check() {
  try {
    await sequelize.authenticate();
    console.log("Connected.");
    const [users] = await sequelize.query("SELECT * FROM users WHERE user_id = 6");
    console.log("User 6:", users);
    const [rooms] = await sequelize.query("SELECT * FROM rooms WHERE room_id = 1");
    console.log("Room 1:", rooms);

    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:", tables.map(t => t.table_name));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sequelize.close();
  }
}

check();
