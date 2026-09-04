const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add an event title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add an event date']
  },
  registrationDeadline: {
    type: Date
  },
  location: {
    type: String,
    required: [true, 'Please add an event location'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify event capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  ticketPrice: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  pageViews: {
    type: Number,
    default: 0
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  attendanceCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);
