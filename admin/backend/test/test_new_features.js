const axios = require('axios');

const BASE_URL = 'http://localhost:4001/api';
const ADMIN_EMAIL = 'admin';
const ADMIN_PASS = '123456';

async function test() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: ADMIN_EMAIL,
      password: ADMIN_PASS
    });
    const token = loginRes.data.token;
    console.log('Login successful. Token:', token ? 'Yes' : 'No');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test Get Available
    console.log('\nTesting Get Available Rooms (2025-12-20 to 2025-12-25)...');
    const availRes = await axios.get(`${BASE_URL}/admin/rooms/available?from=2025-12-20&to=2025-12-25`, { headers });
    console.log('Available Rooms:', availRes.data.length);
    if (availRes.data.length > 0) {
        console.log('First available room:', availRes.data[0].room_number);
    }

    // 3. Test Toggle Status
    // Get first room ID
    const roomsRes = await axios.get(`${BASE_URL}/admin/rooms`, { headers });
    const firstRoom = roomsRes.data[0];
    console.log(`\nTesting Toggle Status for Room ${firstRoom.room_number} (ID: ${firstRoom.room_id})...`);
    console.log('Initial Status:', firstRoom.status);

    // Toggle
    const toggleRes = await axios.patch(`${BASE_URL}/admin/rooms/${firstRoom.room_id}/toggle`, {}, { headers });
    console.log('Status after toggle:', toggleRes.data.status);

    // Toggle back
    const toggleBackRes = await axios.patch(`${BASE_URL}/admin/rooms/${firstRoom.room_id}/toggle`, {}, { headers });
    console.log('Status after second toggle:', toggleBackRes.data.status);

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
