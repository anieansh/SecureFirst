const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    // Password might be empty if logged in via Firebase exclusively
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
