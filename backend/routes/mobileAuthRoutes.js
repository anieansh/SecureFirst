const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'securefirst-secret-key-2026';

try {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (e) {
  console.log('[Mobile Auth] Warning: serviceAccountKey.json not found, initializing with projectId only.');
  try {
    admin.initializeApp({
      projectId: 'first-4b330'
    });
  } catch (err) {
    console.error('[Mobile Auth] Failed to initialize firebase-admin:', err);
  }
}

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, mobile: user.mobile },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

let otpStore = {};

// POST /check-user
router.post('/check-user', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ success: false, error: 'Mobile number is required' });
  }
  try {
    const user = await User.findOne({ mobile });
    return res.json({ 
      success: true, 
      data: { exists: !!user, name: user ? user.name : null } 
    });
  } catch (err) {
    console.error('[Mobile Auth] Check user error:', err);
    return res.status(500).json({ success: false, error: 'Failed to check user' });
  }
});

// POST /register
router.post('/register', async (req, res) => {
  const { mobile, email, password, name } = req.body;

  if (!mobile || !email || !password || !name) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      mobile,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim()
    });
    
    await newUser.save();
    const token = generateToken(newUser);

    console.log(`[Mobile Auth] New user registered: ${mobile}`);
    return res.status(201).json({
      success: true,
      data: {
        userId: newUser._id,
        token,
        user: { mobile: newUser.mobile, email: newUser.email, name: newUser.name }
      }
    });
  } catch (err) {
    console.error('[Mobile Auth] Registration error:', err);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ success: false, error: 'Mobile and password are required' });
  }

  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, error: 'Please login using Firebase/OTP' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    const token = generateToken(user);
    console.log(`[Mobile Auth] User logged in: ${mobile}`);
    return res.json({
      success: true,
      data: {
        userId: user._id,
        token,
        user: { mobile: user.mobile, email: user.email, name: user.name }
      }
    });
  } catch (err) {
    console.error('[Mobile Auth] Login error:', err);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /forgot-password
router.post('/forgot-password', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ success: false, error: 'Mobile number is required' });
  }
  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[mobile] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };
    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    return res.json({
      success: true,
      data: { message: `OTP sent to ${maskedEmail}`, maskedEmail }
    });
  } catch (err) {
    console.error('[Mobile Auth] Forgot password error:', err);
    return res.status(500).json({ success: false, error: 'Process failed' });
  }
});

// POST /verify-reset-otp
router.post('/verify-reset-otp', (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ success: false, error: 'Mobile and OTP are required' });
  }
  const stored = otpStore[mobile];
  if (!stored || Date.now() > stored.expiresAt || stored.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
  }
  return res.json({ success: true, data: { message: 'OTP verified' } });
});

// POST /reset-password
router.post('/reset-password', async (req, res) => {
  const { mobile, otp, newPassword } = req.body;
  const stored = otpStore[mobile];
  if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
  }
  try {
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    delete otpStore[mobile];
    return res.json({ success: true, data: { message: 'Password reset successful' } });
  } catch (err) {
    console.error('[Mobile Auth] Reset password error:', err);
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// POST /change-password
router.post('/change-password', async (req, res) => {
  const { mobile, currentPassword, newPassword } = req.body;
  try {
    const user = await User.findOne({ mobile });
    if (!user || !user.password) return res.status(404).json({ success: false, error: 'User not found or no password set' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Incorrect current password' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (err) {
    console.error('[Mobile Auth] Change password error:', err);
    return res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// POST /verify-otp-firebase (Existing User Login)
router.post('/verify-otp-firebase', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, error: 'ID Token is required' });
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    let mobile = decodedToken.phone_number; 
    if (mobile.startsWith('+91')) mobile = mobile.replace('+91', '');
    
    let user = await User.findOne({ mobile });
    if (!user) {
      // If user not found in DB but OTP verified, we need them to go to signup
      // But this endpoint is specifically for existing users.
      return res.status(404).json({ success: false, error: 'User record not found in database. Please signup.' });
    }

    if (!user.firebaseUid) {
      user.firebaseUid = decodedToken.uid;
      await user.save();
    }

    const token = generateToken(user);
    console.log(`[Mobile Auth] Existing user verified OTP: ${mobile}`);
    return res.json({
      success: true,
      data: {
        userId: user._id,
        token,
        user: { mobile: user.mobile, email: user.email, name: user.name }
      }
    });
  } catch (error) {
    console.error('[Mobile Auth] OTP Verification error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// POST /register-firebase (New User Signup)
router.post('/register-firebase', async (req, res) => {
  const { idToken, name, email } = req.body;
  if (!idToken || !name || !email) {
    return res.status(400).json({ success: false, error: 'Token, name and email are required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    let mobile = decodedToken.phone_number; 
    if (mobile.startsWith('+91')) mobile = mobile.replace('+91', '');

    let user = await User.findOne({ mobile });
    if (user) {
      // Update existing user if they somehow hit register
      user.name = name.trim();
      user.email = email.toLowerCase().trim();
      user.firebaseUid = decodedToken.uid;
    } else {
      user = new User({
        mobile,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        firebaseUid: decodedToken.uid
      });
    }
    
    await user.save();
    const token = generateToken(user);

    console.log(`[Mobile Auth] New user registered via OTP: ${mobile}`);
    return res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        token,
        user: { mobile: user.mobile, email: user.email, name: user.name }
      }
    });
  } catch (error) {
    console.error('[Mobile Auth] Registration error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// POST /firebase-login (Legacy/Combined)
router.post('/firebase-login', async (req, res) => {
  const { idToken, name, email } = req.body;
  if (!idToken) return res.status(400).json({ success: false, error: 'ID Token is required' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    let mobile = decodedToken.phone_number; 
    if (mobile.startsWith('+91')) mobile = mobile.replace('+91', '');
    if (!mobile) return res.status(400).json({ success: false, error: 'Token missing phone number' });

    let user = await User.findOne({ mobile });
    if (!user) {
      user = new User({ mobile, email: email || '', name: name || 'SecureFirst User', firebaseUid: decodedToken.uid });
      await user.save();
    } else if (!user.firebaseUid) {
      user.firebaseUid = decodedToken.uid;
      await user.save();
    }

    const token = generateToken(user);
    console.log(`[Mobile Auth] User logged in via Firebase: ${mobile}`);
    return res.json({
      success: true,
      data: {
        userId: user._id,
        token,
        user: { mobile: user.mobile, email: user.email, name: user.name }
      }
    });
  } catch (error) {
    console.error('[Mobile Auth] Firebase error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

module.exports = router;
