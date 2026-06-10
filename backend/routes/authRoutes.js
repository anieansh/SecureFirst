const express = require('express');
const router = express.Router();
const { generateSecret, verify } = require('otplib');
const qrcode = require('qrcode');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Policy = require('../models/Policy');
const Lead = require('../models/Lead');
const AdminConfig = require('../models/AdminConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'securefirst-secret-key-2026';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123'; // Default fallback

// Helper to get or initialize admin settings from DB
const getAdminSettings = async () => {
  let config = await AdminConfig.findOne({ key: 'admin_auth' });
  if (!config) {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    config = new AdminConfig({
      key: 'admin_auth',
      value: {
        passwordHash: hashedPassword,
        mfaSecret: '',
        mfaEnabled: false
      }
    });
    await config.save();
  }
  return config;
};

// POST /login - Check password
router.post('/login', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const config = await getAdminSettings();
    const isMatch = await bcrypt.compare(password, config.value.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // If password is correct, check if MFA is setup
    return res.json({
      success: true,
      mfaSetupRequired: !config.value.mfaEnabled,
      message: 'Password verified'
    });
  } catch (err) {
    console.error('[Admin Auth] Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /setup-mfa - Generate QR code for first time setup
router.get('/setup-mfa', async (req, res) => {
  try {
    const config = await getAdminSettings();
    if (config.value.mfaEnabled) {
      return res.status(400).json({ error: 'MFA already setup' });
    }

    // Generate a secret
    const secret = generateSecret();
    // Save it temporarily in DB
    config.value.mfaSecret = secret;
    config.markModified('value');
    await config.save();

    // Generate the otpauth URL
    const encodedIssuer = encodeURIComponent('SecureFirst Admin');
    const encodedAccount = encodeURIComponent('admin@securefirst.com');
    const otpauth = `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}`;

    const defaultImageUrl = await qrcode.toDataURL(otpauth);
    return res.json({ qrCodeUrl: defaultImageUrl, secret });
  } catch (err) {
    console.error('[Admin Auth] Setup MFA error:', err);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// POST /verify-mfa - Verify the 6-digit code
router.post('/verify-mfa', async (req, res) => {
  const { token, isSetup } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const config = await getAdminSettings();
    const isValid = verify({ token, secret: config.value.mfaSecret });

    if (isValid) {
      // If this was the setup verification, enable MFA
      if (isSetup) {
        config.value.mfaEnabled = true;
        config.markModified('value');
        await config.save();
      }

      // Generate actual JWT signed token for Admin
      const authToken = jwt.sign(
        { role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.json({ success: true, authToken });
    } else {
      return res.status(400).json({ error: 'Invalid authenticator code' });
    }
  } catch (err) {
    console.error('[Admin Auth] Verify MFA error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /delete-account-web (Web portal Firebase OTP Soft Delete)
router.post('/delete-account-web', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, error: 'Firebase ID Token is required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    let mobile = decodedToken.phone_number;
    if (!mobile) {
      return res.status(400).json({ success: false, error: 'Token missing phone number' });
    }

    if (mobile.startsWith('+91')) {
      mobile = mobile.replace('+91', '');
    }

    const user = await User.findOne({ mobile, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'No active account found for this phone number.' });
    }

    const timestamp = Date.now();
    const originalMobile = user.mobile;
    const originalEmail = user.email;
    const originalUid = user.firebaseUid || decodedToken.uid;

    // 1. Soft delete the User by renaming unique fields & setting flags
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.mobile = `${originalMobile}_deleted_${timestamp}`;
    user.email = `${originalEmail}_deleted_${timestamp}`;
    user.firebaseUid = `${originalUid}_deleted_${timestamp}`;
    await user.save();

    // 2. Soft delete Policy records
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

    // 4. Delete Firebase Auth User credential
    try {
      await admin.auth().deleteUser(decodedToken.uid);
      console.log(`[Auth Web] Deleted Firebase User Auth record for: ${decodedToken.uid}`);
    } catch (fbErr) {
      console.error(`[Auth Web] Firebase User Auth deletion warning:`, fbErr.message);
    }

    console.log(`[Auth Web] Account successfully soft-deleted via web for mobile: ${originalMobile}`);
    return res.json({ success: true, message: 'Your account and associated data have been deleted successfully.' });

  } catch (err) {
    console.error('[Auth Web] Web delete account error:', err);
    return res.status(401).json({ success: false, error: 'Invalid or expired verification token' });
  }
});

module.exports = router;
