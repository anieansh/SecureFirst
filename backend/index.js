require('dotenv').config();
const express = require('express');
const cors = require('cors');
const policyRoutes = require('./routes/policyRoutes');
const leadRoutes = require('./routes/leadRoutes');
const authRoutes = require('./routes/authRoutes');
const mobileAuthRoutes = require('./routes/mobileAuthRoutes');
const configRoutes = require('./routes/configRoutes');
const apiKeyAuth = require('./middleware/apiKeyAuth');

const requireMobileUser = require('./middleware/mobileAuth');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api', requireMobileUser, policyRoutes);
app.use('/api', requireMobileUser, leadRoutes);
app.use('/api/mobile-auth', apiKeyAuth, mobileAuthRoutes);
app.use('/api/config', apiKeyAuth, configRoutes);

app.get('/', (req, res) => {
  res.send('Secure First API is running IN-MEMORY mode.');
});

app.listen(PORT, () => {
  console.log(`Backend server running IN-MEMORY on port ${PORT}`);
});
