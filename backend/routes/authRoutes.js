const express = require('express');
const router = express.Router();
const { generateSecret, verify } = require('otplib');
const qrcode = require('qrcode');
const admin = require('firebase-admin');
const User = require('../models/User');
const Policy = require('../models/Policy');
const Lead = require('../models/Lead');

// In-memory admin settings
let adminAuth = {
  password: '123', // Hardcoded simple password for testing initially
  mfaSecret: '',   // Empty means MFA not setup
  mfaEnabled: false
};

// POST /login - Check password
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password !== adminAuth.password) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // If password is correct, check if MFA is setup
  return res.json({
    success: true,
    mfaSetupRequired: !adminAuth.mfaEnabled,
    message: 'Password verified'
  });
});

// GET /setup-mfa - Generate QR code for first time setup
router.get('/setup-mfa', async (req, res) => {
  if (adminAuth.mfaEnabled) {
    return res.status(400).json({ error: 'MFA already setup' });
  }

  // Generate a secret
  const secret = generateSecret();
  // Save it temporarily (in memory)
  adminAuth.mfaSecret = secret;

  // Generate the otpauth URL
  const encodedIssuer = encodeURIComponent('SecureFirst Admin');
  const encodedAccount = encodeURIComponent('admin@securefirst.com');
  const otpauth = `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}`;

  try {
    const defaultImageUrl = await qrcode.toDataURL(otpauth);
    return res.json({ qrCodeUrl: defaultImageUrl, secret });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// POST /verify-mfa - Verify the 6-digit code
router.post('/verify-mfa', (req, res) => {
  const { token, isSetup } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const isValid = verify({ token, secret: adminAuth.mfaSecret });

  if (isValid) {
    // If this was the setup verification, enable MFA
    if (isSetup) {
      adminAuth.mfaEnabled = true;
    }
    return res.json({ success: true, authToken: 'fake-jwt-token-for-admin' });
  } else {
    return res.status(400).json({ error: 'Invalid authenticator code' });
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
