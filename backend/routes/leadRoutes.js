const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

let leads = [
  { _id: 'ld-1', name: 'Demo User', mobileNumber: '9992735143', policyType: 'Motor', vehicleNumber: 'MH02AB1234', createdAt: new Date().toISOString() }
];

// GET /leads
router.get('/leads', (req, res) => {
  res.status(200).json([...leads].reverse());
});

// POST /leads
router.post('/leads', upload.fields([
  { name: 'rcImage', maxCount: 1 },
  { name: 'previousPolicyImage', maxCount: 1 }
]), (req, res) => {
  try {
    const { name, mobileNumber, policyType, carCondition, carName, exShowroomPrice, vehicleNumber } = req.body;
    
    if (!name || !mobileNumber || !policyType) {
      return res.status(400).json({ error: 'Missing name, mobile, or policy type.' });
    }

    const newLead = {
      _id: 'ld-' + Math.random().toString(36).substr(2, 9),
      name,
      mobileNumber,
      policyType,
      carCondition,
      carName,
      exShowroomPrice,
      vehicleNumber,
      createdAt: new Date().toISOString()
    };

    if (req.files && req.files['rcImage']) {
      newLead.rcImagePath = `/uploads/${req.files['rcImage'][0].filename}`;
    }
    if (req.files && req.files['previousPolicyImage']) {
      newLead.previousPolicyPath = `/uploads/${req.files['previousPolicyImage'][0].filename}`;
    }

    leads.push(newLead);
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Lead creation error:', error);
    res.status(500).json({ error: 'Failed to create lead', details: error.message });
  }
});

module.exports = router;
