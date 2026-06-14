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

// POST /send-otp
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ success: false, error: 'Mobile number is required' });
  }

  try {
    const user = await User.findOne({ mobile, isDeleted: { $ne: true } });
    const isNewUser = !user;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[mobile] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.startsWith('91') && cleanMobile.length > 10) {
      // already has country code
    } else {
      cleanMobile = '91' + cleanMobile;
    }

    const payload = {
      apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZmY1OGVkYWIwYjRhNTMyOTE5MGMxMCIsIm5hbWUiOiJTRUNVUkUgRklSU1QiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjlmZjU4ZWRhYjBiNGE1MzI5MTkwYzBiIiwiYWN0aXZlUGxhbiI6IkZSRUVfRk9SRVZFUiIsImlhdCI6MTc3ODM0MjEyNX0.rIewZkqrioMIeasLLk_KVmFZCvqC7gxOd0wZMbIxkEY",
      campaignName: "OTP AUTNETICATION",
      destination: cleanMobile,
      userName: user ? user.name : "User",
      templateParams: [
        otp
      ],
      source: "new-landing-page form",
      media: {},
      buttons: [
        {
          "type": "button",
          "sub_type": "url",
          "index": 0,
          "parameters": [
            {
              "type": "text",
              "text": otp
            }
          ]
        }
      ],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        "FirstName": user ? user.name : "user"
      }
    };

    console.log(`[Aisensy OTP] Sending OTP ${otp} to destination ${cleanMobile} for ${user ? 'existing' : 'new'} user`);

    const response = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    console.log(`[Aisensy OTP] Aisensy API response:`, responseData);

    return res.json({
      success: true,
      data: {
        isNewUser
      }
    });

  } catch (err) {
    console.error('[Aisensy OTP] Send OTP error:', err);
    return res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// POST /verify-otp
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ success: false, error: 'Mobile and OTP are required' });
  }

  const stored = otpStore[mobile];
  if (!stored || Date.now() > stored.expiresAt || stored.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
  }

  try {
    const user = await User.findOne({ mobile, isDeleted: { $ne: true } });
    if (!user) {
      return res.json({
        success: true,
        data: {
          message: 'OTP verified. Please proceed to registration.',
          isNewUser: true
        }
      });
    }

    const token = generateToken(user);
    console.log(`[Aisensy OTP] User logged in: ${mobile}`);
    
    // Clear OTP after successful verify
    delete otpStore[mobile];

    return res.json({
      success: true,
      data: {
        userId: user._id,
        token,
        user: { mobile: user.mobile, email: user.email, name: user.name }
      }
    });

  } catch (err) {
    console.error('[Aisensy OTP] Verification error:', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// POST /register-otp
router.post('/register-otp', async (req, res) => {
  const { mobile, otp, name, email, phoneType } = req.body;
  if (!mobile || !otp || !name) {
    return res.status(400).json({ success: false, error: 'Mobile, OTP and name are required' });
  }

  const stored = otpStore[mobile];
  if (!stored || Date.now() > stored.expiresAt || stored.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
  }

  try {
    const existingUser = await User.findOne({ mobile, isDeleted: { $ne: true } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'User already exists' });
    }

    let detectedPhoneType = phoneType;
    if (!detectedPhoneType) {
      const userAgent = req.headers['user-agent'] || '';
      if (userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ipad') || userAgent.toLowerCase().includes('ios') || userAgent.toLowerCase().includes('cfnetwork') || userAgent.toLowerCase().includes('darwin')) {
        detectedPhoneType = 'iOS';
      } else {
        detectedPhoneType = 'Android';
      }
    }

    const newUser = new User({
      mobile,
      email: email ? email.toLowerCase().trim() : '',
      name: name.trim(),
      phoneType: detectedPhoneType
    });

    await newUser.save();
    const token = generateToken(newUser);

    delete otpStore[mobile];

    console.log(`[Aisensy OTP] New user registered via OTP: ${mobile}`);
    return res.status(201).json({
      success: true,
      data: {
        userId: newUser._id,
        token,
        user: { mobile: newUser.mobile, email: newUser.email, name: newUser.name }
      }
    });
  } catch (err) {
    console.error('[Aisensy OTP] Registration error:', err);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

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
  const { mobile, email, password, name, phoneType } = req.body;

  if (!mobile || !email || !password || !name) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'User already exists' });
    }

    let detectedPhoneType = phoneType;
    if (!detectedPhoneType) {
      const userAgent = req.headers['user-agent'] || '';
      if (userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ipad') || userAgent.toLowerCase().includes('ios') || userAgent.toLowerCase().includes('cfnetwork') || userAgent.toLowerCase().includes('darwin')) {
        detectedPhoneType = 'iOS';
      } else {
        detectedPhoneType = 'Android';
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      mobile,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      phoneType: detectedPhoneType
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

// Firebase OTP endpoints removed in favor of Aisensy OTP

// POST /delete-account (In-App Soft Delete)
router.post('/delete-account', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token is required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const mobile = decoded.mobile;

    const user = await User.findOne({ mobile, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    const timestamp = Date.now();
    const originalMobile = user.mobile;
    const originalEmail = user.email;
    const originalUid = user.firebaseUid;

    // 1. Soft delete the User by renaming unique fields & setting flags
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.mobile = `${originalMobile}_deleted_${timestamp}`;
    user.email = `${originalEmail}_deleted_${timestamp}`;
    if (originalUid) {
      user.firebaseUid = `${originalUid}_deleted_${timestamp}`;
    }
    await user.save();

    // 2. Soft delete Policy records
    const Policy = require('../models/Policy');
    await Policy.updateMany(
      { mobileNumber: originalMobile, isDeleted: { $ne: true } },
      { 
        $set: { 
          isDeleted: true, 
          deletedAt: new Date(),
          mobileNumber: `${originalMobile}_deleted_${timestamp}`
        } 
      }
    );

    // 3. Soft delete Lead records
    const Lead = require('../models/Lead');
    await Lead.updateMany(
      { mobileNumber: originalMobile, isDeleted: { $ne: true } },
      { 
        $set: { 
          isDeleted: true, 
          deletedAt: new Date(),
          mobileNumber: `${originalMobile}_deleted_${timestamp}`
        } 
      }
    );

    // 4. Delete Firebase Auth User credential if exists
    if (originalUid) {
      try {
        await admin.auth().deleteUser(originalUid);
        console.log(`[Mobile Auth] Deleted Firebase User Auth record for: ${originalUid}`);
      } catch (fbErr) {
        console.error(`[Mobile Auth] Firebase User Auth deletion warning:`, fbErr.message);
      }
    }

    console.log(`[Mobile Auth] Account successfully soft-deleted for mobile: ${originalMobile}`);
    return res.json({ success: true, message: 'Your account and associated data have been deleted successfully.' });

  } catch (err) {
    console.error('[Mobile Auth] Delete account error:', err);
    return res.status(401).json({ success: false, error: 'Invalid or expired session token' });
  }
});

module.exports = router;
