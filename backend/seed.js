require('dotenv').config();
const mongoose = require('mongoose');
const Policy = require('./models/Policy');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secureFirst';

const today = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

// The mobile user will use 9999999999 to see these 2 policies
const samplePolicies = [
  // Mobile User (9999999999) - 2 Policies
  {
    clientName: 'Alice Johnson', mobileNumber: '9999999999', clientEmail: 'alice@example.com',
    policyType: 'Motor', policyNumber: 'MOT-1001', insurer: 'SecureRide', vehicleNumber: 'KA01AB1234',
    issueDate: new Date('2023-01-01').toISOString(), expiryDate: new Date(today + 7 * dayMs).toISOString(), sumInsured: 500000, annualPremium: 12000, attachedDocument: 'Alice_Motor_1001.pdf'
  },
  {
    clientName: 'Alice Johnson', mobileNumber: '9999999999', clientEmail: 'alice@example.com',
    policyType: 'Motor', policyNumber: 'MOT-2005', insurer: 'DriveSure', vehicleNumber: 'MH02XY9876',
    issueDate: new Date('2023-05-15').toISOString(), expiryDate: new Date(today + 150 * dayMs).toISOString(), sumInsured: 300000, annualPremium: 8500
  },

  // Other Admin Users (13 more policies)
  {
    clientName: 'Bob Smith', mobileNumber: '8888888888', clientEmail: 'bob@example.com',
    policyType: 'Non Motor', policyNumber: 'HOM-3001', insurer: 'HomeGuard', productType: 'Property Insurance', coverageType: 'Fire & Theft', supportingDocument: 'sample_supporting.pdf', attachedDocument: 'sample.pdf',
    issueDate: new Date('2021-11-20').toISOString(), expiryDate: new Date(today - 5 * dayMs).toISOString(), sumInsured: 1000000, annualPremium: 15000
  },
  {
    clientName: 'Charlie Davis', mobileNumber: '7777777777', clientEmail: 'charlie@example.com',
    policyType: 'Travel', policyNumber: 'TRV-4001', insurer: 'WanderSafe',
    issueDate: new Date('2020-01-10').toISOString(), expiryDate: new Date(today + 300 * dayMs).toISOString(), sumInsured: 5000000, annualPremium: 25000
  },
  {
    clientName: 'Charlie Davis', mobileNumber: '7777777777', clientEmail: 'charlie@example.com',
    policyType: 'Travel', policyNumber: 'TRV-4002', insurer: 'WanderSafe',
    issueDate: new Date('2023-10-01').toISOString(), expiryDate: new Date(today + 12 * dayMs).toISOString(), sumInsured: 100000, annualPremium: 5000
  },
  {
    clientName: 'Diana Prince', mobileNumber: '6666666666', clientEmail: 'diana@example.com',
    policyType: 'Motor', policyNumber: 'MOT-5001', insurer: 'SecureRide', vehicleNumber: 'DL04ZC1111',
    issueDate: new Date('2022-06-15').toISOString(), expiryDate: new Date(today + 45 * dayMs).toISOString(), sumInsured: 750000, annualPremium: 18000
  },
  {
    clientName: 'Evan Wright', mobileNumber: '5555555555', clientEmail: 'evan@example.com',
    policyType: 'Motor', policyNumber: 'MOT-6001', insurer: 'DriveSure', vehicleNumber: 'TN07BM5432',
    issueDate: new Date('2022-12-01').toISOString(), expiryDate: new Date(today - 20 * dayMs).toISOString(), sumInsured: 400000, annualPremium: 9000
  },
  {
    clientName: 'Fiona Gallagher', mobileNumber: '4444444444', clientEmail: 'fiona@example.com',
    policyType: 'Non Motor', policyNumber: 'HOM-7001', insurer: 'HomeGuard', productType: 'Liability Insurance', coverageType: 'General Liability', attachedDocument: 'fiona_doc.pdf',
    issueDate: new Date('2023-03-10').toISOString(), expiryDate: new Date(today + 14 * dayMs).toISOString(), sumInsured: 800000, annualPremium: 12500
  },  {
    clientName: 'George Clooney', mobileNumber: '3333333333', clientEmail: 'george@example.com',
    policyType: 'Non Motor', policyNumber: 'HOM-8001', insurer: 'HomeGuard', productType: 'Commercial Insurance', coverageType: 'Business Interruption', supportingDocument: 'business_supporting.pdf', attachedDocument: 'george_doc.pdf',
    issueDate: new Date('2019-08-20').toISOString(), expiryDate: new Date(today + 200 * dayMs).toISOString(), sumInsured: 2000000, annualPremium: 40000
  },
  {
    clientName: 'Hannah Abbott', mobileNumber: '2222222222', clientEmail: 'hannah@example.com',
    policyType: 'Travel', policyNumber: 'TRV-9001', insurer: 'WanderSafe',
    issueDate: new Date('2023-09-01').toISOString(), expiryDate: new Date(today + 5 * dayMs).toISOString(), sumInsured: 600000, annualPremium: 14000
  },
  {
    clientName: 'Ian Somerhalder', mobileNumber: '1111111111', clientEmail: 'ian@example.com',
    policyType: 'Motor', policyNumber: 'MOT-1002', insurer: 'SecureRide', vehicleNumber: 'UP32MN4567',
    issueDate: new Date('2023-01-20').toISOString(), expiryDate: new Date(today - 2 * dayMs).toISOString(), sumInsured: 250000, annualPremium: 7000
  },
  {
    clientName: 'Jackie Chan', mobileNumber: '1234567890', clientEmail: 'jackie@example.com',
    policyType: 'Travel', policyNumber: 'TRV-2003', insurer: 'WanderSafe',
    issueDate: new Date('2024-01-01').toISOString(), expiryDate: new Date(today + 60 * dayMs).toISOString(), sumInsured: 50000, annualPremium: 2000
  },
  {
    clientName: 'Kevin Hart', mobileNumber: '0987654321', clientEmail: 'kevin@example.com',
    policyType: 'Motor', policyNumber: 'MOT-3004', insurer: 'DriveSure', vehicleNumber: 'RJ14CV6789',
    issueDate: new Date('2021-05-15').toISOString(), expiryDate: new Date(today + 10 * dayMs).toISOString(), sumInsured: 1500000, annualPremium: 22000
  },
  {
    clientName: 'Laura Dern', mobileNumber: '1122334455', clientEmail: 'laura@example.com',
    policyType: 'Non Motor', policyNumber: 'HOM-4005', insurer: 'HomeGuard', productType: 'Homeowners Insurance', coverageType: 'Structure & Contents', attachedDocument: 'laura_doc.pdf',
    issueDate: new Date('2022-11-10').toISOString(), expiryDate: new Date(today + 90 * dayMs).toISOString(), sumInsured: 1200000, annualPremium: 16000
  },
  {
    clientName: 'Laura Dern', mobileNumber: '1122334455', clientEmail: 'laura@example.com',
    policyType: 'Motor', policyNumber: 'MOT-5006', insurer: 'DriveSure', vehicleNumber: 'GJ01KL9012',
    issueDate: new Date('2023-04-20').toISOString(), expiryDate: new Date(today - 12 * dayMs).toISOString(), sumInsured: 450000, annualPremium: 9500
  }
];

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Clearing old data...');
    await Policy.deleteMany({});
    
    const validatedPolicies = samplePolicies.map(p => ({
      ...p,
      policyHolderName: p.policyHolderName || p.clientName,
      vehicleType: (p.policyType === 'Motor' && !p.vehicleType) ? 'Sedan' : p.vehicleType,
      vehicleNumber: (p.policyType === 'Motor' && !p.vehicleNumber) ? 'MH01AB1234' : p.vehicleNumber,
      attachedDocument: p.attachedDocument || 'policy_sample.pdf'
    }));
    await Policy.insertMany(validatedPolicies);
    
    console.log('Seed successful! Added 15 policies across ' + [...new Set(samplePolicies.map(p => p.mobileNumber))].length + ' unique clients.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to seed DB', err);
    process.exit(1);
  });
