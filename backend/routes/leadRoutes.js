const express = require('express');
const router = express.Router();

let leads = [
  { _id: 'ld-1', name: 'Demo User', mobileNumber: '9992735143', policyType: 'Motor', vehicleNumber: 'MH02AB1234', createdAt: new Date().toISOString() }
];

// GET /leads
router.get('/leads', (req, res) => {
  res.status(200).json([...leads].reverse());
});

// POST /leads
router.post('/leads', (req, res) => {
  const { name, mobileNumber, policyType, vehicleNumber } = req.body;
  if (!name || !mobileNumber || !policyType) {
    return res.status(400).json({ error: 'Missing name, mobile, or policy type.' });
  }

  const newLead = {
    _id: 'ld-' + Math.random().toString(36).substr(2, 9),
    name,
    mobileNumber,
    policyType,
    vehicleNumber: policyType === 'Motor' ? (vehicleNumber || '') : undefined,
    createdAt: new Date().toISOString()
  };

  leads.push(newLead);
  res.status(201).json(newLead);
});

module.exports = router;
