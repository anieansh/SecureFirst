require('dotenv').config();
const mongoose = require('mongoose');
const Policy = require('./models/Policy');
const Lead = require('./models/Lead');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secureFirst';

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Starting cleanup...');

    // Delete all policies (they are all dummy data currently)
    const polRes = await Policy.deleteMany({});
    console.log(`Deleted ${polRes.deletedCount} dummy policies.`);

    // Delete all leads except Amolak
    const leadRes = await Lead.deleteMany({ name: { $ne: 'Amolak' } });
    console.log(`Deleted ${leadRes.deletedCount} dummy leads.`);

    // Keep Amolak Singh leads
    console.log('Preserving real leads for Amolak.');

    // Optional: Clear dummy users if any
    const userRes = await User.deleteMany({ mobile: { $in: ['9999999999', '8888888888', '7777777777'] } });
    console.log(`Deleted ${userRes.deletedCount} dummy users.`);

    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
