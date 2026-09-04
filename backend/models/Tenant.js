const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a club name'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Please add a club slug'],
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  primaryColor: {
    type: String,
    default: '#3b82f6' // Default Blue
  },
  secondaryColor: {
    type: String,
    default: '#10b981' // Default Emerald
  },
  logo: {
    type: String,
    default: 'Award' // Icon name from lucide-react
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  broadcastMessage: {
    type: String,
    default: ''
  },
  certificateTemplateUrl: {
    type: String,
    default: ''
  },
  certificateStyle: {
    type: String,
    enum: ['default_dark', 'custom_template'],
    default: 'default_dark'
  },
  signatory1Name: {
    type: String,
    default: 'Alex Mercer'
  },
  signatory1Title: {
    type: String,
    default: 'Club Lead / Admin'
  },
  signatory2Name: {
    type: String,
    default: 'Dr. V. K. Sharma'
  },
  signatory2Title: {
    type: String,
    default: 'Campus Super Admin / Dean'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tenant', TenantSchema);
