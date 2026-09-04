const express = require('express');
const router = express.Router({ mergeParams: true });
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const generateToken = (userId, tenantId, role) => {
  return jwt.sign(
    { userId, tenantId, role },
    process.env.AUTH_JWT_SECRET || 'super_secret_auth_token_key_12345',
    { expiresIn: '7d' }
  );
};

// POST /api/club/:slug/auth/signup - Create helper organizer/admin (Club Admins only)
router.post('/signup', authenticate, authorize('CLUB_ADMIN'), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    }

    // Unique email check
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists' });
    }

    // Role safety - limit roles that can be signed up dynamically
    const assignedRole = role && ['CLUB_ADMIN', 'ORGANIZER'].includes(role) ? role : 'CLUB_ADMIN';

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      tenantId: req.tenant._id,
      role: assignedRole
    });

    const token = generateToken(user._id, req.tenant._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Signup failed', error: error.message });
  }
});

// POST /api/club/:slug/auth/login - Authenticate club admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Tenant isolation verification:
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.tenantId || user.tenantId.toString() !== req.tenant._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access forbidden: Your account is not authorized for this club portal' 
        });
      }
    }

    const token = generateToken(user._id, user.tenantId || null, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

module.exports = router;
