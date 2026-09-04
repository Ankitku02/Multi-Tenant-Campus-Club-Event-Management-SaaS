const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET || 'super_secret_auth_token_key_12345');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User matching token not found' });
    }

    req.user = user;

    // Cross-tenant data separation validation:
    // SUPER_ADMIN can manage all tenants. Others must belong to the active club (req.tenant).
    if (user.role !== 'SUPER_ADMIN') {
      if (!req.tenant || user.tenantId.toString() !== req.tenant._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: Token is not scoped for this club' });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access forbidden: Role '${req.user.role}' lacks sufficient privileges` 
      });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };
