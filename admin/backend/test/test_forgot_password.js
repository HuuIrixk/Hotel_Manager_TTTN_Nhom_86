const axios = require('axios');

const API_URL = 'http://localhost:4001/api/auth';
const EMAIL = 'magonsilver05@gmail.com';

async function testForgotPasswordFlow() {
  try {
    console.log('1. Testing Forgot Password...');
    const forgotRes = await axios.post(`${API_URL}/forgot-password`, { email: EMAIL });
    console.log('Forgot Password Response:', forgotRes.data);

    if (!forgotRes.data.token) {
      throw new Error('No token returned from forgot-password');
    }

    const token = forgotRes.data.token;
    console.log('Token received:', token);

    console.log('2. Testing Reset Password...');
    const newPassword = 'newpassword123';
    const resetRes = await axios.post(`${API_URL}/reset-password`, {
      token,
      newPassword
    });
    console.log('Reset Password Response:', resetRes.data);

    console.log('SUCCESS: Forgot Password Flow Verified!');

  } catch (error) {
    console.error('TEST FAILED:', error.response ? error.response.data : error.message);
  }
}

testForgotPasswordFlow();
