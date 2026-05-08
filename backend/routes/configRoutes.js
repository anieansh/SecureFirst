const express = require('express');
const router = express.Router();

router.get('/version', (req, res) => {
  // For testing the force update UI, we require 1.0.1
  // The app currently has 1.0.0
  res.json({
    minimumAppVersion: "1.0.1",
    latestAppVersion: "1.0.1",
    updateUrls: {
      ios: "https://apps.apple.com/app/id123456789",
      android: "https://play.google.com/store/apps/details?id=com.anonymous.mobileapp"
    }
  });
});

module.exports = router;
