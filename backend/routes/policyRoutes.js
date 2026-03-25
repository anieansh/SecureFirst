const express = require('express');
const router = express.Router();

const today = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

// In-Memory Database (replaces MongoDB since user doesn't have it installed)
let policies = [
  // Mobile User (9999999999) - 2 Policies
  {
    _id: '1', clientName: 'Alice Johnson', mobileNumber: '9999999999', clientEmail: 'alice@example.com',
    policyType: 'Motor', policyNumber: 'MOT-1001', insurer: 'SecureRide', vehicleNumber: 'KA01AB1234',
    issueDate: new Date('2023-01-01').toISOString(), expiryDate: new Date(today + 7 * dayMs).toISOString(), sumInsured: 500000, annualPremium: 12000, attachedDocument: 'Alice_Motor_1001.pdf'
  },
  {
    _id: '2', clientName: 'Alice Johnson', mobileNumber: '9999999999', clientEmail: 'alice@example.com',
    policyType: 'Motor', policyNumber: 'MOT-2005', insurer: 'DriveSure', vehicleNumber: 'MH02XY9876',
    issueDate: new Date('2023-05-15').toISOString(), expiryDate: new Date(today + 150 * dayMs).toISOString(), sumInsured: 300000, annualPremium: 8500
  },
  // Other Admin Users (13 more policies)
  {
    _id: '3', clientName: 'Bob Smith', mobileNumber: '8888888888', clientEmail: 'bob@example.com',
    policyType: 'Home', policyNumber: 'HOM-3001', insurer: 'HomeGuard',
    issueDate: new Date('2021-11-20').toISOString(), expiryDate: new Date(today - 5 * dayMs).toISOString(), sumInsured: 1000000, annualPremium: 15000, attachedDocument: 'Home_Policy_Doc.pdf'
  },
  {
    _id: '4', clientName: 'Charlie Davis', mobileNumber: '7777777777', clientEmail: 'charlie@example.com',
    policyType: 'Travel', policyNumber: 'TRV-4001', insurer: 'WanderSafe',
    issueDate: new Date('2020-01-10').toISOString(), expiryDate: new Date(today + 300 * dayMs).toISOString(), sumInsured: 5000000, annualPremium: 25000
  },
  {
    _id: '5', clientName: 'Charlie Davis', mobileNumber: '7777777777', clientEmail: 'charlie@example.com',
    policyType: 'Travel', policyNumber: 'TRV-4002', insurer: 'WanderSafe',
    issueDate: new Date('2023-10-01').toISOString(), expiryDate: new Date(today + 12 * dayMs).toISOString(), sumInsured: 100000, annualPremium: 5000
  },
  {
    _id: '6', clientName: 'Diana Prince', mobileNumber: '6666666666', clientEmail: 'diana@example.com',
    policyType: 'Motor', policyNumber: 'MOT-5001', insurer: 'SecureRide', vehicleNumber: 'DL04ZC1111',
    issueDate: new Date('2022-06-15').toISOString(), expiryDate: new Date(today + 45 * dayMs).toISOString(), sumInsured: 750000, annualPremium: 18000
  },
  {
    _id: '7', clientName: 'Evan Wright', mobileNumber: '5555555555', clientEmail: 'evan@example.com',
    policyType: 'Motor', policyNumber: 'MOT-6001', insurer: 'DriveSure', vehicleNumber: 'TN07BM5432',
    issueDate: new Date('2022-12-01').toISOString(), expiryDate: new Date(today - 20 * dayMs).toISOString(), sumInsured: 400000, annualPremium: 9000
  },
  {
    _id: '8', clientName: 'Fiona Gallagher', mobileNumber: '4444444444', clientEmail: 'fiona@example.com',
    policyType: 'Home', policyNumber: 'HOM-7001', insurer: 'HomeGuard',
    issueDate: new Date('2023-03-10').toISOString(), expiryDate: new Date(today + 14 * dayMs).toISOString(), sumInsured: 800000, annualPremium: 12500
  },
  {
    _id: '9', clientName: 'George Clooney', mobileNumber: '3333333333', clientEmail: 'george@example.com',
    policyType: 'Home', policyNumber: 'HOM-8001', insurer: 'HomeGuard',
    issueDate: new Date('2019-08-20').toISOString(), expiryDate: new Date(today + 200 * dayMs).toISOString(), sumInsured: 2000000, annualPremium: 40000
  },
  {
    _id: '10', clientName: 'Hannah Abbott', mobileNumber: '2222222222', clientEmail: 'hannah@example.com',
    policyType: 'Travel', policyNumber: 'TRV-9001', insurer: 'WanderSafe',
    issueDate: new Date('2023-09-01').toISOString(), expiryDate: new Date(today + 5 * dayMs).toISOString(), sumInsured: 600000, annualPremium: 14000
  },
  {
    _id: '11', clientName: 'Ian Somerhalder', mobileNumber: '1111111111', clientEmail: 'ian@example.com',
    policyType: 'Motor', policyNumber: 'MOT-1002', insurer: 'SecureRide', vehicleNumber: 'UP32MN4567',
    issueDate: new Date('2023-01-20').toISOString(), expiryDate: new Date(today - 2 * dayMs).toISOString(), sumInsured: 250000, annualPremium: 7000
  },
  {
    _id: '12', clientName: 'Jackie Chan', mobileNumber: '1234567890', clientEmail: 'jackie@example.com',
    policyType: 'Travel', policyNumber: 'TRV-2003', insurer: 'WanderSafe',
    issueDate: new Date('2024-01-01').toISOString(), expiryDate: new Date(today + 60 * dayMs).toISOString(), sumInsured: 50000, annualPremium: 2000
  },
  {
    _id: '13', clientName: 'Kevin Hart', mobileNumber: '0987654321', clientEmail: 'kevin@example.com',
    policyType: 'Motor', policyNumber: 'MOT-3004', insurer: 'DriveSure', vehicleNumber: 'RJ14CV6789',
    issueDate: new Date('2021-05-15').toISOString(), expiryDate: new Date(today + 10 * dayMs).toISOString(), sumInsured: 1500000, annualPremium: 22000
  },
  {
    _id: '14', clientName: 'Laura Dern', mobileNumber: '1122334455', clientEmail: 'laura@example.com',
    policyType: 'Home', policyNumber: 'HOM-4005', insurer: 'HomeGuard',
    issueDate: new Date('2022-11-10').toISOString(), expiryDate: new Date(today + 90 * dayMs).toISOString(), sumInsured: 1200000, annualPremium: 16000
  },
  {
    _id: '15', clientName: 'Laura Dern', mobileNumber: '1122334455', clientEmail: 'laura@example.com',
    policyType: 'Motor', policyNumber: 'MOT-5006', insurer: 'DriveSure', vehicleNumber: 'GJ01KL9012',
    issueDate: new Date('2023-04-20').toISOString(), expiryDate: new Date(today - 12 * dayMs).toISOString(), sumInsured: 450000, annualPremium: 9500
  }
];

// POST /policy → add policy
router.post('/policy', (req, res) => {
  let { clientName, mobileNumber, clientEmail, policyType, policyNumber, insurer, issueDate, expiryDate, sumInsured, annualPremium, attachedDocument, vehicleNumber } = req.body;
  
  if (policyType === 'Motor') {
    sumInsured = sumInsured || 0;
    if (!vehicleNumber) {
      return res.status(400).json({ error: 'vehicleNumber is required for Motor policies' });
    }
  }

  if (!clientName || !mobileNumber || !policyType || !policyNumber || !insurer || !issueDate || !expiryDate || sumInsured === undefined || sumInsured === '' || annualPremium === undefined || annualPremium === '' || !attachedDocument) {
    return res.status(400).json({ error: 'Missing required fields including attached document' });
  }

  const newPolicy = {
    _id: Math.random().toString(36).substr(2, 9),
    clientName, mobileNumber, clientEmail, policyType, policyNumber, insurer,
    issueDate: new Date(issueDate).toISOString(),
    expiryDate: new Date(expiryDate).toISOString(),
    sumInsured: Number(sumInsured),
    annualPremium: Number(annualPremium),
    attachedDocument: attachedDocument
  };
  
  if (policyType === 'Motor') {
    newPolicy.vehicleNumber = vehicleNumber;
  }

  policies.push(newPolicy);
  res.status(201).json(newPolicy);
});

// GET /policies → get all policies
router.get('/policies', (req, res) => {
  // Return reversed to show newest first
  res.status(200).json([...policies].reverse());
});

// GET /policy/:mobile → get policies by mobile
router.get('/policy/:mobile', (req, res) => {
  const { mobile } = req.params;
  const filtered = policies.filter(p => p.mobileNumber === mobile);
  res.status(200).json(filtered.reverse());
});

// GET /clients → get unique clients based on policies
router.get('/clients', (req, res) => {
  const clientMap = {};
  policies.forEach(p => {
    if (!clientMap[p.mobileNumber]) {
      clientMap[p.mobileNumber] = {
        name: p.clientName,
        mobileNumber: p.mobileNumber,
        email: p.clientEmail,
        numberOfPolicies: 0,
        policies: []
      };
    }
    clientMap[p.mobileNumber].numberOfPolicies += 1;
    clientMap[p.mobileNumber].policies.push(p);
  });

  const clients = Object.values(clientMap).map(c => {
    let hasActive = false;
    let hasExpiring = false;
    const now = new Date();

    c.policies.forEach(p => {
      const expiry = new Date(p.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 15) hasActive = true;
      else if (diffDays >= 0 && diffDays <= 15) hasExpiring = true;
    });

    let status = 'Expired';
    if (hasExpiring) status = 'Expiring';
    else if (hasActive) status = 'Active';

    return { name: c.name, mobileNumber: c.mobileNumber, email: c.email || 'N/A', numberOfPolicies: c.numberOfPolicies, status };
  });

  res.status(200).json(clients);
});

module.exports = router;
