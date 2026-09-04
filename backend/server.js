require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const resolveTenant = require('./middleware/tenant');
const User = require('./models/User');

// Connect to Database
connectDB().then(() => {
  seedSuperAdmin();
});

// Seed default Super Admin account if none exists
async function seedSuperAdmin() {
  try {
    const superAdminExists = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!superAdminExists) {
      await User.create({
        username: 'Campus Super Admin',
        email: 'admin@campus.edu',
        password: 'Admin@123',
        role: 'SUPER_ADMIN'
      });
      console.log('✅ Default Super Admin provisioned: admin@campus.edu / Admin@123');
    }
  } catch (err) {
    console.error('Super Admin seed check error:', err.message);
  }
}

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Root API probe
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Global Platform Management & Super Admin Routes
app.use('/api/super-admin', require('./routes/superAdmin'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/certificates', require('./routes/certificates'));

// Club-Scoped Routes (with tenant isolation middleware)
app.use('/api/club/:slug/auth', resolveTenant, require('./routes/auth'));
app.use('/api/club/:slug/events', resolveTenant, require('./routes/events'));
app.use('/api/club/:slug', resolveTenant, require('./routes/registrations'));

// Fallback Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource API endpoint not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
