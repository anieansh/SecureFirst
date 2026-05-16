const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Lead = require('../models/Lead');

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

// GET /leads
router.get('/leads', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leads });
  } catch (err) {
    console.error('[Lead] Error fetching leads:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

// POST /leads
router.post('/leads', upload.fields([
  { name: 'rcImage', maxCount: 1 },
  { name: 'previousPolicyImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, mobileNumber, policyType, carCondition, carName, exShowroomPrice, vehicleNumber } = req.body;
    
    if (!name || !mobileNumber || !policyType) {
      return res.status(400).json({ success: false, error: 'Missing name, mobile, or policy type.' });
    }

    const leadData = {
      name,
      mobileNumber,
      policyType,
      carCondition,
      carName,
      exShowroomPrice,
      vehicleNumber
    };

    if (req.files && req.files['rcImage']) {
      leadData.rcImagePath = `/uploads/${req.files['rcImage'][0].filename}`;
    }
    if (req.files && req.files['previousPolicyImage']) {
      leadData.previousPolicyPath = `/uploads/${req.files['previousPolicyImage'][0].filename}`;
    }

    const newLead = new Lead(leadData);
    await newLead.save();
    
    console.log(`[Lead] New lead created for ${name} (${mobileNumber})`);
    res.status(201).json({ 
      success: true, 
      data: { 
        lead: newLead 
      } 
    });
  } catch (error) {
    console.error('[Lead] Lead creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create lead', details: error.message });
  }
});

module.exports = router;
