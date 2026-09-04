const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add attendee name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add attendee email'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  qid: {
    type: String,
    trim: true,
    default: ''
  },
  rollNumber: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  year: {
    type: String,
    trim: true,
    default: ''
  },
  passId: {
    type: String,
    required: true,
    unique: true
  },
  passToken: {
    type: String,
    required: true
  },
  certificateId: {
    type: String,
    unique: true,
    sparse: true
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date
  },
  emailStatus: {
    type: String,
    enum: ['SENT', 'SIMULATED', 'FAILED', 'PENDING'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index to prevent duplicate registrations for the same event
RegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
