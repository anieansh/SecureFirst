const API_URL = 'http://localhost:5001/api/mobile-auth';
const API_KEY = '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92';
const mobile = '9999999999';

async function runTest() {
  const otp = process.argv[2];

  if (!otp) {
    console.log('1. Testing send-otp...');
    const sendRes = await fetch(`${API_URL}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({ mobile })
    });
    const sendData = await sendRes.json();
    console.log('Send OTP response:', sendData);

    console.log('\n--- Action Required ---');
    console.log('Please copy the 6-digit OTP logged by the backend server console,');
    console.log('and run this script again passing the OTP as an argument:');
    console.log('node test_otp.js <otp_code>\n');
    return;
  }

  console.log(`2. Testing verify-otp with code: ${otp}...`);
  const verifyRes = await fetch(`${API_URL}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ mobile, otp })
  });
  const verifyData = await verifyRes.json();
  console.log('Verify OTP response:', verifyData);

  if (verifyData.success && verifyData.data && verifyData.data.isNewUser) {
    console.log('\n3. Testing register-otp (User is new)...');
    const registerRes = await fetch(`${API_URL}/register-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        mobile,
        otp,
        name: 'Test Aisensy User',
        email: 'test@securefirst.co'
      })
    });
    const registerData = await registerRes.json();
    console.log('Register OTP response:', registerData);
  }
}

runTest().catch(console.error);
