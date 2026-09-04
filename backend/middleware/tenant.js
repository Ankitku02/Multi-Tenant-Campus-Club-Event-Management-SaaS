const Tenant = require('../models/Tenant');

const resolveTenant = async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Club slug parameter is required' });
    }

    const tenant = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (!tenant) {
      return res.status(404).json({ success: false, message: `Club '${slug}' not found` });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Tenant resolution error', error: error.message });
  }
};

module.exports = resolveTenant;
