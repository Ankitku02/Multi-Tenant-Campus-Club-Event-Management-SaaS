const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Tenant = require('../models/Tenant');

// GET /api/certificates/verify/:certificateId - Global certificate verification endpoint
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    if (!certificateId) {
      return res.status(400).json({ success: false, message: 'Certificate ID is required' });
    }

    const registration = await Registration.findOne({
      certificateId: certificateId.trim().toUpperCase()
    })
    .populate('eventId', 'title description date location')
    .populate('tenantId', 'name slug primaryColor secondaryColor logo');

    if (!registration) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Invalid Certificate: No issued certificate found with this verification ID.'
      });
    }

    if (!registration.certificateIssued) {
      return res.status(403).json({
        success: false,
        verified: false,
        message: 'Certificate not yet released: Attendance verification and Admin approval are pending.'
      });
    }

    res.json({
      success: true,
      verified: true,
      data: {
        certificateId: registration.certificateId,
        attendeeName: registration.name,
        qid: registration.qid || registration.rollNumber || 'N/A',
        rollNumber: registration.qid || registration.rollNumber || 'N/A',
        department: registration.department || 'N/A',
        year: registration.year || 'N/A',
        email: registration.email,
        checkedIn: registration.checkedIn,
        checkInTime: registration.checkInTime,
        issuedAt: registration.checkInTime || registration.createdAt,
        eventTitle: registration.eventId ? registration.eventId.title : 'Campus Event',
        eventDate: registration.eventId ? registration.eventId.date : null,
        eventLocation: registration.eventId ? registration.eventId.location : null,
        clubName: registration.tenantId ? registration.tenantId.name : 'Campus Club',
        clubSlug: registration.tenantId ? registration.tenantId.slug : '',
        primaryColor: registration.tenantId ? registration.tenantId.primaryColor : '#3b82f6',
        secondaryColor: registration.tenantId ? registration.tenantId.secondaryColor : '#10b981',
        logo: registration.tenantId ? registration.tenantId.logo : 'Award'
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Certificate verification failed', error: error.message });
  }
});

module.exports = router;
