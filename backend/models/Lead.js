const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  policyType: {
    type: String,
    required: true,
    enum: ['Motor', 'Home', 'Travel'],
  },
  carCondition: {
    type: String,
    enum: ['New', 'Old'],
    required: function() {
      return this.policyType === 'Motor';
    }
  },
  carName: {
    type: String,
    required: function() {
      return this.policyType === 'Motor' && this.carCondition === 'New';
    }
  },
  exShowroomPrice: {
    type: String,
    required: function() {
      return this.policyType === 'Motor' && this.carCondition === 'New';
    }
  },
  vehicleNumber: {
    type: String,
    // Only required if we want it for old cars, but previously it was for motor generally.
    // The instructions said "if new car show car name and price. If old car show RC and Policy".
    // I will leave vehicleNumber optional.
  },
  rcImagePath: {
    type: String,
  },
  previousPolicyPath: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
