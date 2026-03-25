const express = require('express');
const router = express.Router();
const { generateSecret, verify } = require('otplib');
const qrcode = require('qrcode');

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

module.exports = router;
