const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const User = require('../models/User');

// GET /api/tenants - List all club tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await Tenant.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: tenants.length, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve clubs', error: error.message });
  }
});

// POST /api/tenants - Create a new club tenant & initial admin
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, primaryColor, secondaryColor, logo, adminUsername, adminEmail, adminPassword } = req.body;
    
    if (!name || !slug || !adminUsername || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'All fields (including Admin Username, Email, and Password) are required' });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    const existingTenant = await Tenant.findOne({ slug: cleanSlug });
    if (existingTenant) {
      return res.status(400).json({ success: false, message: `Club slug '${cleanSlug}' is already taken` });
    }

    // Check if admin email already exists globally
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this admin email address already exists' });
    }

    const tenant = await Tenant.create({
      name,
      slug: cleanSlug,
      description,
      primaryColor: primaryColor || '#3b82f6',
      secondaryColor: secondaryColor || '#10b981',
      logo: logo || 'Award'
    });

    // Create the associated administrator user
    await User.create({
      username: adminUsername,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      tenantId: tenant._id,
      role: 'CLUB_ADMIN'
    });

    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create club', error: error.message });
  }
});

// GET /api/tenants/:slug - Retrieve club tenant by slug (branding config)
router.get('/:slug', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ slug: req.params.slug.toLowerCase() });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve club branding', error: error.message });
  }
});

module.exports = router;
