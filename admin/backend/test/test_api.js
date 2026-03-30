const axios = require("axios");

async function test() {
  try {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await axios.post("http://localhost:4001/api/auth/login", {
      username: "admin",
      password: "123456"
    });

    const token = loginRes.data.token;
    console.log("Login successful. Token:", token ? "Yes" : "No");

    // 2. Get Bookings
    console.log("Fetching bookings...");
    const bookingsRes = await axios.get("http://localhost:4001/api/admin/bookings", {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`Status: ${bookingsRes.status}`);
    console.log(`Bookings found: ${bookingsRes.data.length}`);
    if (bookingsRes.data.length > 0) {
      console.log("First booking ID:", bookingsRes.data[0].booking_id);
    }

  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
