const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5001/api';
const API_KEY = '1f39bc30096f61eb69144d2534136ecfe431f87d57ceb6ab3ed0be9f21866a92';
const JWT_SECRET = process.env.JWT_SECRET || 'securefirst-secret-key-2026';

// Generate mock JWTs
const mobileToken = jwt.sign(
  { id: '123', mobile: '9999999999' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testEndpoint(name, url, method, headers, body) {
  try {
    const res = await fetch(`${API_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    console.log(`[Test] ${name}: Code ${res.status}`);
    const data = await res.json();
    return { status: res.status, data };
  } catch (err) {
    console.error(`[Test Error] ${name} failed:`, err.message);
    return { status: 500, error: err.message };
  }
}

async function runSecurityTests() {
  console.log('--- STARTING SECURITY VULNERABILITY TESTS ---');

  // Test 1: Query all policies without any authentication
  await testEndpoint(
    '1. Get all policies without Auth',
    '/policies',
    'GET',
    {}
  );

  // Test 2: Query all policies with X-API-Key only (Testing old exploit)
  await testEndpoint(
    '2. Get all policies with X-API-Key only',
    '/policies',
    'GET',
    { 'X-API-Key': API_KEY }
  );

  // Test 3: Query other user policies with Mobile user token (BOLA check)
  await testEndpoint(
    '3. Get policies of another mobile number (BOLA)',
    '/policy/8888888888',
    'GET',
    {
      'X-API-Key': API_KEY,
      'Authorization': `Bearer ${mobileToken}`
    }
  );

  // Test 4: Query own policies with Mobile user token (Authorized view)
  await testEndpoint(
    '4. Get policies of own mobile number',
    '/policy/9999999999',
    'GET',
    {
      'X-API-Key': API_KEY,
      'Authorization': `Bearer ${mobileToken}`
    }
  );

  // Test 5: Query general admin-only endpoint with Mobile user token
  await testEndpoint(
    '5. Get all policies using mobile token',
    '/policies',
    'GET',
    {
      'X-API-Key': API_KEY,
      'Authorization': `Bearer ${mobileToken}`
    }
  );

  // Test 6: Query admin-only endpoint using Admin token
  await testEndpoint(
    '6. Get all policies using admin token',
    '/policies',
    'GET',
    {
      'X-API-Key': API_KEY,
      'Authorization': `Bearer ${adminToken}`
    }
  );

  // Test 7: Query another user policies with Admin token
  await testEndpoint(
    '7. Get policies of any mobile number using admin token',
    '/policy/8888888888',
    'GET',
    {
      'X-API-Key': API_KEY,
      'Authorization': `Bearer ${adminToken}`
    }
  );
}

runSecurityTests().catch(console.error);
