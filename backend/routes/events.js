const express = require('express');
const router = express.Router({ mergeParams: true });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { Resend } = require('resend');

const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { authenticate, authorize } = require('../middleware/auth');

const nodemailer = require('nodemailer');

// Universal Email Dispatch Helper (Gmail SMTP priority -> Resend fallback -> Simulation)
async function dispatchTicketEmail({ to, subject, html, attachments, clubName }) {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS.replace(/\s+/g, '')
        }
      });
      await transporter.sendMail({
        from: `"${clubName}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.content,
          encoding: 'base64',
          contentType: a.contentType
        }))
      });
      console.log(`✅ Live Gmail Ticket dispatched successfully to: ${to}`);
      return { success: true, simulated: false };
    } catch (err) {
      console.error('❌ Gmail SMTP dispatch failed:', err.message);
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      await resendClient.emails.send({
        from: `${clubName} <onboarding@resend.dev>`,
        to,
        subject,
        html,
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType
        }))
      });
      console.log(`✅ Resend ticket dispatched to: ${to}`);
      return { success: true, simulated: false };
    } catch (err) {
      console.error('Resend dispatch error:', err.message);
    }
  }

  return { success: true, simulated: true };
}

// Initialize Razorpay SDK if keys are configured
const Razorpay = require('razorpay');
let razorpay;
const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID && 
                             process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id' &&
                             process.env.RAZORPAY_KEY_SECRET && 
                             process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret';

if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}


// GET /api/club/:slug/events - Get public events list scoped to the club
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ tenantId: req.tenant._id }).sort({ date: 1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve events', error: error.message });
  }
});

// POST /api/club/:slug/events - Create new event (Admin only)
router.post('/', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER'), async (req, res) => {
  try {
    const { title, description, date, registrationDeadline, location, capacity, ticketPrice } = req.body;
    if (!title || !date || !location || !capacity) {
      return res.status(400).json({ success: false, message: 'Title, date, location, and capacity are required' });
    }

    const event = await Event.create({
      tenantId: req.tenant._id,
      title,
      description,
      date: new Date(date),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      location,
      capacity: parseInt(capacity),
      ticketPrice: parseFloat(ticketPrice || 0)
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create event', error: error.message });
  }
});

// GET /api/club/:slug/events/:eventId - Get event details (Increments pageViews)
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid Event ID' });
    }

    // Atomically increment page view count and get event
    const event = await Event.findOneAndUpdate(
      { _id: eventId, tenantId: req.tenant._id },
      { $inc: { pageViews: 1 } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve event details', error: error.message });
  }
});

// PUT /api/club/:slug/events/:eventId - Update event (Admin only)
router.put('/:eventId', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER'), async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid Event ID' });
    }

    const { title, description, date, registrationDeadline, location, capacity, ticketPrice } = req.body;

    const event = await Event.findOneAndUpdate(
      { _id: eventId, tenantId: req.tenant._id },
      {
        $set: {
          title,
          description,
          date: date ? new Date(date) : undefined,
          registrationDeadline: registrationDeadline !== undefined ? (registrationDeadline ? new Date(registrationDeadline) : null) : undefined,
          location,
          capacity: capacity ? parseInt(capacity) : undefined,
          ticketPrice: ticketPrice !== undefined ? parseFloat(ticketPrice) : undefined
        }
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update event', error: error.message });
  }
});

// DELETE /api/club/:slug/events/:eventId - Delete event (Admin only)
router.delete('/:eventId', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER'), async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid Event ID' });
    }

    const event = await Event.findOneAndDelete({ _id: eventId, tenantId: req.tenant._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
    }

    // Clean up related registrations
    await Registration.deleteMany({ eventId });

    res.json({ success: true, message: 'Event and associated tickets deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete event', error: error.message });
  }
});

// POST /api/club/:slug/events/:eventId/register - Register attendee & generate QR pass
router.post('/:eventId/register', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, phone, qid, rollNumber, department, year } = req.body;
    const userQid = (qid || rollNumber || '').trim();

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid Event ID' });
    }

    // Retrieve event details
    const event = await Event.findOne({ _id: eventId, tenantId: req.tenant._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check duplicate registration first
    const alreadyRegistered = await Registration.findOne({ eventId, email: email.toLowerCase() });
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: 'You have already registered for this event' });
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event registration is closed: The registration closing date/time has passed' 
      });
    }

    // Check capacity limit
    if (event.registrationCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event registration is closed. Capacity reached' });
    }

    // Razorpay Paid Event Handling
    if (event.ticketPrice > 0 && isRazorpayConfigured) {
      const amountPaisa = Math.round(event.ticketPrice * 100);
      const options = {
        amount: amountPaisa,
        currency: 'INR',
        receipt: `rcpt_${new mongoose.Types.ObjectId()}`
      };

      try {
        const order = await razorpay.orders.create(options);
        return res.status(200).json({
          success: true,
          requiresPayment: true,
          paymentDetails: {
            keyId: process.env.RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            orderId: order.id,
            clubName: req.tenant.name,
            eventTitle: event.title
          }
        });
      } catch (err) {
        console.error('Razorpay order creation failed:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to create payment order' });
      }
    }

    // Atomic capacity limit check & count increment (For Free Events / Unconfigured keys fallback)
    const capacityApprovedEvent = await Event.findOneAndUpdate(
      { 
        _id: eventId, 
        tenantId: req.tenant._id,
        $expr: { $lt: ['$registrationCount', '$capacity'] }
      },
      { $inc: { registrationCount: 1 } },
      { new: true }
    );

    if (!capacityApprovedEvent) {
      return res.status(400).json({ success: false, message: 'Event registration is closed. Capacity reached' });
    }

    // Pre-generate object ID for token
    const registrationId = new mongoose.Types.ObjectId();
    const passId = `PASS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const certificateId = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Generate signed JWT for the event pass (no personal info inside token)
    const passToken = jwt.sign(
      {
        type: 'EVENT_PASS',
        passId,
        registrationId: registrationId.toString(),
        eventId: eventId.toString(),
        tenantId: req.tenant._id.toString()
      },
      process.env.PASS_JWT_SECRET || 'super_secret_event_pass_key_54321'
    );

    // Save registration
    const registration = new Registration({
      _id: registrationId,
      tenantId: req.tenant._id,
      eventId,
      name,
      email: email.toLowerCase(),
      phone: phone ? phone.trim() : '',
      qid: userQid,
      rollNumber: userQid,
      department: department ? department.trim() : '',
      year: year ? year.trim() : '',
      passId,
      passToken,
      certificateId,
      certificateIssued: false,
      emailStatus: 'PENDING'
    });

    await registration.save();

    // Generate QR code data URL (Base64)
    const qrCodeBase64 = await QRCode.toDataURL(passToken);

    // Email Dispatch (with mock simulator fallback)
    let emailSentDetails = {
      to: email,
      subject: `Your ticket for ${event.title}`,
      body: `Hello ${name},\n\nYour registration for "${event.title}" is confirmed!\nHere is your ticket code: ${passId}`,
      simulated: true,
      qrCodeBase64
    };

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 500px; margin: auto;">
        <h2 style="color: #38bdf8; margin-top: 0;">🎟️ Event Pass Confirmed!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your registration for <strong>${event.title}</strong> has been confirmed successfully.</p>
        <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0;"><strong>Event:</strong> ${event.title}</p>
          <p style="margin: 4px 0;"><strong>Pass ID:</strong> <span style="color: #fbbf24; font-family: monospace;">${passId}</span></p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${event.location}</p>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">Please present your attached QR Pass at the gate entrance for check-in.</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 20px;">Sent via ${req.tenant.name} Event Management Portal</p>
      </div>
    `;

    const dispatchResult = await dispatchTicketEmail({
      to: email,
      subject: emailSentDetails.subject,
      html: emailHtml,
      attachments: [
        {
          filename: `${passId}_pass.png`,
          content: qrCodeBase64.split(',')[1],
          contentType: 'image/png'
        }
      ],
      clubName: req.tenant.name
    });

    emailSentDetails.simulated = dispatchResult.simulated;
    registration.emailStatus = dispatchResult.simulated ? 'SIMULATED' : 'SENT';
    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        registrationId: registration._id,
        passId: registration.passId,
        certificateId: registration.certificateId,
        certificateIssued: registration.certificateIssued,
        emailStatus: registration.emailStatus,
        qrCode: qrCodeBase64,
        emailDetails: emailSentDetails
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already registered for this event' });
    }
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// POST /api/club/:slug/events/:eventId/verify-payment - Verify Razorpay payment signature & finalize booking
router.post('/:eventId/verify-payment', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, phone, qid, rollNumber, department, year, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userQid = (qid || rollNumber || '').trim();

    if (!name || !email || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment signature verification details' });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid Event ID' });
    }

    // Verify cryptographic signature from Razorpay
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = hmac.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed: Signature mismatch.' });
    }

    const event = await Event.findOne({ _id: eventId, tenantId: req.tenant._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Atomic check-in slot allocation
    const capacityApprovedEvent = await Event.findOneAndUpdate(
      { 
        _id: eventId, 
        tenantId: req.tenant._id,
        $expr: { $lt: ['$registrationCount', '$capacity'] }
      },
      { $inc: { registrationCount: 1 } },
      { new: true }
    );

    if (!capacityApprovedEvent) {
      return res.status(400).json({ success: false, message: 'Event registration is closed. Capacity reached' });
    }

    const registrationId = new mongoose.Types.ObjectId();
    const passId = `PASS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const certificateId = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const passToken = jwt.sign(
      {
        type: 'EVENT_PASS',
        passId,
        registrationId: registrationId.toString(),
        eventId: eventId.toString(),
        tenantId: req.tenant._id.toString()
      },
      process.env.PASS_JWT_SECRET || 'super_secret_event_pass_key_54321'
    );

    const registration = new Registration({
      _id: registrationId,
      tenantId: req.tenant._id,
      eventId,
      name,
      email: email.toLowerCase(),
      phone: phone ? phone.trim() : '',
      qid: userQid,
      rollNumber: userQid,
      department: department ? department.trim() : '',
      year: year ? year.trim() : '',
      passId,
      passToken,
      certificateId,
      certificateIssued: false,
      emailStatus: 'PENDING'
    });

    await registration.save();

    const qrCodeBase64 = await QRCode.toDataURL(passToken);

    let emailSentDetails = {
      to: email,
      subject: `Your ticket for ${event.title}`,
      body: `Hello ${name},\n\nYour registration for "${event.title}" is confirmed!\nHere is your ticket code: ${passId}`,
      simulated: true,
      qrCodeBase64
    };

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 500px; margin: auto;">
        <h2 style="color: #38bdf8; margin-top: 0;">🎟️ Event Pass Confirmed!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your payment and registration for <strong>${event.title}</strong> has been confirmed successfully.</p>
        <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0;"><strong>Event:</strong> ${event.title}</p>
          <p style="margin: 4px 0;"><strong>Pass ID:</strong> <span style="color: #fbbf24; font-family: monospace;">${passId}</span></p>
          <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${event.ticketPrice}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${event.location}</p>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">Please present your attached QR Pass at the gate entrance for check-in.</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 20px;">Sent via ${req.tenant.name} Event Management Portal</p>
      </div>
    `;

    const dispatchResult = await dispatchTicketEmail({
      to: email,
      subject: emailSentDetails.subject,
      html: emailHtml,
      attachments: [
        {
          filename: `${passId}_pass.png`,
          content: qrCodeBase64.split(',')[1],
          contentType: 'image/png'
        }
      ],
      clubName: req.tenant.name
    });

    emailSentDetails.simulated = dispatchResult.simulated;
    registration.emailStatus = dispatchResult.simulated ? 'SIMULATED' : 'SENT';
    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration and Payment successful',
      data: {
        registrationId: registration._id,
        passId: registration.passId,
        certificateId: registration.certificateId,
        certificateIssued: registration.certificateIssued,
        emailStatus: registration.emailStatus,
        qrCode: qrCodeBase64,
        emailDetails: emailSentDetails
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already registered for this event' });
    }
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
});

module.exports = router;
