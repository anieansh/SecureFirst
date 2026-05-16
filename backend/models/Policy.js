const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
    index: true,
  },
  clientEmail: {
    type: String,
  },
  policyType: {
    type: String,
    enum: ['Motor', 'Home', 'Travel'],
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: function() {
      return this.policyType === 'Motor';
    }
  },
  policyNumber: {
    type: String,
    unique: true,
    required: true,
  },
  insurer: {
    type: String,
    required: true,
  },
  issueDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  sumInsured: {
    type: Number,
    required: true,
  },
  annualPremium: {
    type: Number,
    required: true,
  },
  attachedDocument: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
