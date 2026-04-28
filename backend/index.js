require('dotenv').config();
const express = require('express');
const cors = require('cors');
const policyRoutes = require('./routes/policyRoutes');
const leadRoutes = require('./routes/leadRoutes');
const authRoutes = require('./routes/authRoutes');
const mobileAuthRoutes = require('./routes/mobileAuthRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api', policyRoutes);
app.use('/api', leadRoutes);
app.use('/api/mobile-auth', mobileAuthRoutes);

app.get('/', (req, res) => {
  res.send('Secure First API is running IN-MEMORY mode.');
});

app.listen(PORT, () => {
  console.log(`Backend server running IN-MEMORY on port ${PORT}`);
});
