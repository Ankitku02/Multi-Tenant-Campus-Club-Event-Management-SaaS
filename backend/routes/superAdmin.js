const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { authenticate, authorize } = require('../middleware/auth');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.AUTH_JWT_SECRET || 'super_secret_auth_token_key_12345',
    { expiresIn: '7d' }
  );
};

// POST /api/super-admin/login - Authenticate Super Admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'SUPER_ADMIN'
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Super Admin credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Super Admin credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Super Admin login failed', error: error.message });
  }
});

// GET /api/super-admin/dashboard - Global platform-wide analytics
router.get('/dashboard', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const [
      totalTenants,
      totalEvents,
      totalRegistrations,
      totalAttendance,
      eventsWithRevenue,
      recentRegistrations,
      tenants
    ] = await Promise.all([
      Tenant.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
      Registration.countDocuments({ checkedIn: true }),
      Event.find().select('ticketPrice registrationCount'),
      Registration.find()
        .populate('tenantId', 'name slug')
        .populate('eventId', 'title ticketPrice')
        .sort({ createdAt: -1 })
        .limit(10),
      Tenant.find().select('name slug primaryColor secondaryColor logo status createdAt')
    ]);

    // Calculate total campus revenue
    let totalRevenue = 0;
    eventsWithRevenue.forEach(e => {
      if (e.ticketPrice && e.ticketPrice > 0) {
        totalRevenue += e.ticketPrice * (e.registrationCount || 0);
      }
    });

    // Attendance Rate
    const attendanceRate = totalRegistrations > 0 
      ? Math.round((totalAttendance / totalRegistrations) * 100) 
      : 0;

    // Cross-Club Leaderboard & Activity
    const clubPerformance = await Promise.all(
      tenants.map(async (t) => {
        const eventCount = await Event.countDocuments({ tenantId: t._id });
        const regCount = await Registration.countDocuments({ tenantId: t._id });
        const checkInCount = await Registration.countDocuments({ tenantId: t._id, checkedIn: true });
        
        return {
          id: t._id,
          name: t.name,
          slug: t.slug,
          status: t.status || 'ACTIVE',
          primaryColor: t.primaryColor,
          logo: t.logo,
          eventCount,
          regCount,
          checkInCount,
          attendanceRate: regCount > 0 ? Math.round((checkInCount / regCount) * 100) : 0
        };
      })
    );

    // Sort leaderboard by registrations descending
    clubPerformance.sort((a, b) => b.regCount - a.regCount);

    // Department Distribution
    const departmentStats = await Registration.aggregate([
      { $match: { department: { $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalTenants,
          totalEvents,
          totalRegistrations,
          totalAttendance,
          totalRevenue,
          attendanceRate
        },
        clubPerformance,
        departmentDistribution: departmentStats.map(d => ({ department: d._id, count: d.count })),
        recentRegistrations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to aggregate platform analytics', error: error.message });
  }
});

// GET /api/super-admin/tenants - List all club tenants with detailed metadata
router.get('/tenants', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });

    const tenantDetails = await Promise.all(
      tenants.map(async (t) => {
        const eventCount = await Event.countDocuments({ tenantId: t._id });
        const regCount = await Registration.countDocuments({ tenantId: t._id });
        const adminUser = await User.findOne({ tenantId: t._id, role: 'CLUB_ADMIN' }).select('username email');
        
        return {
          ...t.toObject(),
          eventCount,
          regCount,
          adminUser: adminUser || { username: 'Unassigned', email: 'N/A' }
        };
      })
    );

    res.json({ success: true, count: tenantDetails.length, data: tenantDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve tenants', error: error.message });
  }
});

// PUT /api/super-admin/tenants/:tenantId/status - Activate or Suspend a club
router.put('/tenants/:tenantId/status', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be ACTIVE or SUSPENDED' });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { status },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Club tenant not found' });
    }

    res.json({ success: true, message: `Club status updated to ${status}`, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update club status', error: error.message });
  }
});

// PUT /api/super-admin/tenants/:tenantId/reset-password - Reset organizer password
router.put('/tenants/:tenantId/reset-password', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const adminUser = await User.findOne({ tenantId, role: 'CLUB_ADMIN' });
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'No administrator account found for this club' });
    }

    adminUser.password = newPassword;
    await adminUser.save();

    res.json({ success: true, message: `Password reset successfully for organizer (${adminUser.email})` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
});

// DELETE /api/super-admin/tenants/:tenantId - Purge club workspace & cascaded data
router.delete('/tenants/:tenantId', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findByIdAndDelete(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Club tenant not found' });
    }

    // Cascade delete events, registrations, and users
    await Promise.all([
      Event.deleteMany({ tenantId }),
      Registration.deleteMany({ tenantId }),
      User.deleteMany({ tenantId })
    ]);

    res.json({ success: true, message: `Club '${tenant.name}' and all associated events purged successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete club tenant', error: error.message });
  }
});

// GET /api/super-admin/certificates - Unified campus certificates directory
router.get('/certificates', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { search } = req.query;
    let query = { certificateId: { $exists: true, $ne: null } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { certificateId: { $regex: search, $options: 'i' } },
        { qid: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const certificates = await Registration.find(query)
      .populate('tenantId', 'name slug primaryColor')
      .populate('eventId', 'title date location')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: certificates.length, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve certificates', error: error.message });
  }
});

// POST /api/super-admin/broadcast - Set campus-wide broadcast banner
router.post('/broadcast', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { message } = req.body;
    
    // Update broadcast message across all tenants
    await Tenant.updateMany({}, { broadcastMessage: message || '' });

    res.json({ 
      success: true, 
      message: message ? 'Broadcast announcement published across all club portals' : 'Broadcast cleared' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to publish broadcast message', error: error.message });
  }
});

module.exports = router;
