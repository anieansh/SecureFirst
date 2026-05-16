const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');

// POST /policy → add policy
router.post('/policy', async (req, res) => {
  let { clientName, mobileNumber, clientEmail, policyType, policyNumber, insurer, issueDate, expiryDate, sumInsured, annualPremium, attachedDocument, vehicleNumber } = req.body;
  
  if (policyType === 'Motor') {
    sumInsured = sumInsured || 0;
    if (!vehicleNumber) {
      return res.status(400).json({ success: false, error: 'vehicleNumber is required for Motor policies' });
    }
  }

  if (!clientName || !mobileNumber || !policyType || !policyNumber || !insurer || !issueDate || !expiryDate || sumInsured === undefined || sumInsured === '' || annualPremium === undefined || annualPremium === '' || !attachedDocument) {
    return res.status(400).json({ success: false, error: 'Missing required fields including attached document' });
  }

  try {
    const newPolicy = new Policy({
      clientName, 
      mobileNumber, 
      clientEmail, 
      policyType, 
      policyNumber, 
      insurer,
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      sumInsured: Number(sumInsured),
      annualPremium: Number(annualPremium),
      attachedDocument,
      vehicleNumber: policyType === 'Motor' ? vehicleNumber : undefined
    });
    
    await newPolicy.save();
    console.log(`[Policy] New policy added: ${policyNumber} for ${mobileNumber}`);
    res.status(201).json({ 
      success: true, 
      data: { 
        policy: newPolicy 
      } 
    });
  } catch (err) {
    console.error('[Policy] Error adding policy:', err);
    res.status(500).json({ success: false, error: 'Failed to add policy' });
  }
});

// GET /policies → get all policies (Admin)
router.get('/policies', async (req, res) => {
  try {
    const policies = await Policy.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: policies });
  } catch (err) {
    console.error('[Policy] Error fetching policies:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch policies' });
  }
});

// GET /policy/:mobile → get policies by mobile (Mobile App)
router.get('/policy/:mobile', async (req, res) => {
  const { mobile } = req.params;
  console.log(`[Backend] Fetching policies for mobile: ${mobile}`);
  try {
    const filtered = await Policy.find({ mobileNumber: mobile }).sort({ createdAt: -1 });
    console.log(`[Backend] Found ${filtered.length} policies for ${mobile}`);
    res.status(200).json({ success: true, data: filtered });
  } catch (err) {
    console.error('[Policy] Error fetching user policies:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user policies' });
  }
});

// GET /clients → get unique clients based on policies (Admin)
router.get('/clients', async (req, res) => {
  try {
    const policies = await Policy.find();
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

      return { 
        name: c.name, 
        mobileNumber: c.mobileNumber, 
        email: c.email || 'N/A', 
        numberOfPolicies: c.numberOfPolicies, 
        status 
      };
    });

    res.status(200).json({ success: true, data: clients });
  } catch (err) {
    console.error('[Policy] Error fetching clients:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

// DELETE /client/:mobile → delete a client and all their policies
router.delete('/client/:mobile', async (req, res) => {
  const { mobile } = req.params;
  try {
    // Delete all policies for this client
    await Policy.deleteMany({ mobileNumber: mobile });
    
    // Also delete user record if exists
    const User = require('../models/User');
    await User.deleteOne({ mobile: mobile });

    console.log(`[Policy] Client deleted: ${mobile}`);
    res.status(200).json({ success: true, message: 'Client and all associated data deleted successfully' });
  } catch (err) {
    console.error('[Policy] Error deleting client:', err);
    res.status(500).json({ success: false, error: 'Failed to delete client' });
  }
});

// PUT /client/:mobile → update client details
router.put('/client/:mobile', async (req, res) => {
  const { mobile } = req.params;
  const { name, email, newMobile } = req.body;

  try {
    // Update User record
    const User = require('../models/User');
    const user = await User.findOne({ mobile: mobile });
    if (user) {
      if (name) user.name = name;
      if (email) user.email = email;
      if (newMobile) user.mobile = newMobile;
      await user.save();
    }

    // Update all Policies for this client
    const updateData = {};
    if (name) updateData.clientName = name;
    if (email) updateData.clientEmail = email;
    if (newMobile) updateData.mobileNumber = newMobile;

    await Policy.updateMany({ mobileNumber: mobile }, { $set: updateData });

    console.log(`[Policy] Client updated: ${mobile}`);
    res.status(200).json({ success: true, message: 'Client updated successfully' });
  } catch (err) {
    console.error('[Policy] Error updating client:', err);
    res.status(500).json({ success: false, error: 'Failed to update client' });
  }
});

// DELETE /policy/:id → delete a single policy
router.delete('/policy/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Policy.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Policy not found' });
    }
    console.log(`[Policy] Single policy deleted: ${id}`);
    res.status(200).json({ success: true, message: 'Policy deleted successfully' });
  } catch (err) {
    console.error('[Policy] Error deleting single policy:', err);
    res.status(500).json({ success: false, error: 'Failed to delete policy' });
  }
});

module.exports = router;
