const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

try {
  // Try to initialize with service account key if it exists
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (e) {
  // For verifying ID tokens, we only strictly need the project ID.
  console.log('[Mobile Auth] Warning: serviceAccountKey.json not found, initializing with projectId only.');
  try {
    admin.initializeApp({
      projectId: 'first-4b330'
    });
  } catch (err) {
    console.error('[Mobile Auth] Failed to initialize firebase-admin:', err);
  }
}

// In-memory user store for mobile app users
let users = [];

// In-memory OTP store: { mobile: { otp, expiresAt } }
let otpStore = {};

// Helper: find user by mobile
const findUser = (mobile) => users.find(u => u.mobile === mobile);

// POST /check-user — Check if a mobile number is already registered
router.post('/check-user', (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }
  const user = findUser(mobile);
  return res.json({ exists: !!user, name: user ? user.name : null });
});

// POST /register — Register a new mobile app user
router.post('/register', async (req, res) => {
  const { mobile, email, password, name } = req.body;

  if (!mobile || !email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required (mobile, email, password, name)' });
  }

  if (findUser(mobile)) {
    return res.status(409).json({ error: 'User with this mobile number already exists' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      mobile,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);

    console.log(`[Mobile Auth] New user registered: ${mobile} (${name})`);
    return res.status(201).json({
      success: true,
      user: { mobile: newUser.mobile, email: newUser.email, name: newUser.name }
    });
  } catch (err) {
    console.error('[Mobile Auth] Registration error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /login — Login with mobile + password
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ error: 'Mobile and password are required' });
  }

  const user = findUser(mobile);
  if (!user) {
    return res.status(404).json({ error: 'User not found. Please register first.' });
  }

  try {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    console.log(`[Mobile Auth] User logged in: ${mobile}`);
    return res.json({
      success: true,
      user: { mobile: user.mobile, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('[Mobile Auth] Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /forgot-password — Send OTP to user's registered email (simulated)
router.post('/forgot-password', (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  const user = findUser(mobile);
  if (!user) {
    return res.status(404).json({ error: 'No account found with this mobile number' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[mobile] = {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  };

  // Simulate email sending (log to console)
  const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  console.log(`\n========================================`);
  console.log(`  PASSWORD RESET OTP for ${mobile}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  OTP: ${otp}`);
  console.log(`  Expires in: 10 minutes`);
  console.log(`========================================\n`);

  return res.json({
    success: true,
    message: `OTP sent to ${maskedEmail}`,
    maskedEmail
  });
});

// POST /verify-reset-otp — Verify the OTP code
router.post('/verify-reset-otp', (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Mobile and OTP are required' });
  }

  const stored = otpStore[mobile];
  if (!stored) {
    return res.status(400).json({ error: 'No OTP requested for this number. Please request again.' });
  }

  if (Date.now() > stored.expiresAt) {
    delete otpStore[mobile];
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
  }

  return res.json({ success: true, message: 'OTP verified' });
});

// POST /reset-password — Reset password after OTP verification
router.post('/reset-password', async (req, res) => {
  const { mobile, otp, newPassword } = req.body;

  if (!mobile || !otp || !newPassword) {
    return res.status(400).json({ error: 'Mobile, OTP, and new password are required' });
  }

  // Re-verify OTP
  const stored = otpStore[mobile];
  if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  const user = findUser(mobile);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    user.password = await bcrypt.hash(newPassword, 10);
    delete otpStore[mobile]; // Clear used OTP

    console.log(`[Mobile Auth] Password reset for: ${mobile}`);
    return res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('[Mobile Auth] Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /change-password — Change password (when logged in)
router.post('/change-password', async (req, res) => {
  const { mobile, currentPassword, newPassword } = req.body;

  if (!mobile || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const user = findUser(mobile);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    console.log(`[Mobile Auth] Password changed for: ${mobile}`);
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[Mobile Auth] Change password error:', err);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /firebase-login — Verify Firebase OTP and login/register
router.post('/firebase-login', async (req, res) => {
  const { idToken, name, email } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ error: 'ID Token is required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // Note: Firebase includes the country code in phone_number.
    // E.g., +919999999999. If your local DB stores it without +91, 
    // you may need to strip it: decodedToken.phone_number.replace('+91', '')
    let mobile = decodedToken.phone_number; 
    
    // Simple strip if starts with +91 (Assuming India numbers for now)
    if (mobile.startsWith('+91')) {
      mobile = mobile.replace('+91', '');
    }

    if (!mobile) {
      return res.status(400).json({ error: 'Token does not contain a phone number' });
    }

    let user = findUser(mobile);
    if (!user) {
      // Auto-register if not exists
      user = {
        mobile,
        email: email || '',
        name: name || 'SecureFirst User',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      console.log(`[Mobile Auth] New user registered via Firebase: ${mobile}`);
    }

    console.log(`[Mobile Auth] User logged in via Firebase: ${mobile}`);
    return res.json({
      success: true,
      user: { mobile: user.mobile, email: user.email, name: user.name }
    });

  } catch (error) {
    console.error('[Mobile Auth] Firebase token verification error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
