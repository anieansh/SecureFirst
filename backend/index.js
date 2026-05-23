require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const policyRoutes = require('./routes/policyRoutes');
const leadRoutes = require('./routes/leadRoutes');
const authRoutes = require('./routes/authRoutes');
const mobileAuthRoutes = require('./routes/mobileAuthRoutes');
const configRoutes = require('./routes/configRoutes');
const apiKeyAuth = require('./middleware/apiKeyAuth');

const requireMobileUser = require('./middleware/mobileAuth');

const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/secureFirst';

// Database Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/mobile-auth', apiKeyAuth, mobileAuthRoutes);
app.use('/api/config', apiKeyAuth, configRoutes);
app.use('/api', requireMobileUser, policyRoutes);
app.use('/api', requireMobileUser, leadRoutes);

app.get('/delete-account', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/delete-account.html'));
});

app.get('/', (req, res) => {
  res.send('Secure First API is running with Persistent Storage.');
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
