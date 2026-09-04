const express = require('express');
const router = express.Router({ mergeParams: true });
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Tenant = require('../models/Tenant');
const { authenticate, authorize } = require('../middleware/auth');

const QRCode = require('qrcode');

// Helper to dispatch stylized Certificate email to student with image attachments
// Helper to escape XML characters for SVG rendering
const escapeXml = (str = '') => {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Helper to dispatch stylized Certificate email to student with direct certificate file attachments
const dispatchCertificateEmail = async ({ registration, event, tenant }) => {
  const clubName = tenant?.name || 'Campus Club';
  const eventTitle = event?.title || 'Campus Event';
  const attendeeName = registration.name;
  const certificateId = registration.certificateId;
  const to = registration.email;
  const certUrl = `http://localhost:5173/club/${tenant?.slug || 'club'}/certificate/${certificateId}`;
  const issueDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Custom template & dynamic signatories from Tenant
  const customTemplateUrl = tenant?.certificateTemplateUrl || '';
  const sig1Name = tenant?.signatory1Name || 'Alex Mercer';
  const sig1Title = tenant?.signatory1Title || 'Club Lead / Admin';
  const sig2Name = tenant?.signatory2Name || 'Dr. V. K. Sharma';
  const sig2Title = tenant?.signatory2Title || 'Campus Super Admin / Dean';

  // Generate QR Code for certificate verification
  let qrBase64 = '';
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(certUrl, {
      width: 260,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
    qrBase64 = qrDataUrl.split(',')[1];
  } catch (qrErr) {
    console.error('Certificate QR generation error:', qrErr);
  }

  // Safe XML strings for SVG Certificate
  const safeClubName = escapeXml(clubName);
  const safeEventTitle = escapeXml(eventTitle);
  const safeAttendeeName = escapeXml(attendeeName);
  const safeCertId = escapeXml(certificateId);
  const safeSig1Name = escapeXml(sig1Name);
  const safeSig1Title = escapeXml(sig1Title);
  const safeSig2Name = escapeXml(sig2Name);
  const safeSig2Title = escapeXml(sig2Title);

  // Background layers: custom uploaded template OR default luxury gold ornate vector
  const backgroundSvg = customTemplateUrl
    ? `<image href="${customTemplateUrl}" x="0" y="0" width="1414" height="1000" preserveAspectRatio="xMidYMid slice"/>
       <!-- Semi-translucent dark vignette to ensure text contrast on custom designs -->
       <rect width="1414" height="1000" fill="#000000" fill-opacity="0.35"/>
       <rect x="25" y="25" width="1364" height="950" rx="14" fill="none" stroke="#f59e0b" stroke-width="2.5" opacity="0.8"/>`
    : `<!-- Background Canvas -->
       <rect width="1414" height="1000" fill="url(#bgGrad)"/>
       <!-- Outer Double Gold Ornate Borders (A4 Proportional) -->
       <rect x="30" y="30" width="1354" height="940" rx="18" fill="none" stroke="url(#goldGrad)" stroke-width="4.5"/>
       <rect x="50" y="50" width="1314" height="900" rx="12" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="10,8" opacity="0.6"/>
       <!-- Corner Flourishes -->
       <path d="M 60 100 L 100 60 M 60 120 L 120 60 M 1354 100 L 1314 60 M 1354 120 L 1294 60 M 60 900 L 100 940 M 60 880 L 120 940 M 1354 900 L 1314 940 M 1354 880 L 1294 940" stroke="#fbbf24" stroke-width="2.5" opacity="0.75"/>`;

  // Generate high-resolution standalone A4-standard SVG Certificate (1414x1000, 1.414 aspect ratio)
  const certificateSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1414 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="50%" stop-color="#030712"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="goldBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <style>
      @page { size: A4 auto; margin: 0; }
      svg { width: 100%; height: auto; max-width: 100%; max-height: 100%; display: block; margin: auto; }
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
  </defs>

  ${backgroundSvg}

  <!-- Top Club Header -->
  <text x="707" y="130" font-size="18" font-weight="700" letter-spacing="7" fill="#94a3b8" text-anchor="middle" text-transform="uppercase">${safeClubName}</text>
  
  <!-- Title -->
  <text x="707" y="190" font-size="38" font-weight="900" letter-spacing="3" fill="url(#goldGrad)" text-anchor="middle" text-transform="uppercase">CERTIFICATE OF COMPLETION</text>
  <line x1="470" y1="215" x2="944" y2="215" stroke="url(#goldGrad)" stroke-width="2.5"/>

  <!-- Subtitle -->
  <text x="707" y="265" font-size="17" font-style="italic" fill="#94a3b8" text-anchor="middle">This credential officially certifies that</text>

  <!-- Recipient Name -->
  <text x="707" y="345" font-size="50" font-weight="900" letter-spacing="1.5" fill="#ffffff" text-anchor="middle">${safeAttendeeName}</text>
  <line x1="320" y1="370" x2="1094" y2="370" stroke="#f59e0b" stroke-width="3.5"/>

  <!-- Event & Participation Statement -->
  <text x="707" y="420" font-size="19" fill="#cbd5e1" text-anchor="middle">has successfully attended, participated, and completed all requirements for</text>
  <text x="707" y="468" font-size="32" font-weight="800" fill="#fbbf24" text-anchor="middle">${safeEventTitle}</text>
  <text x="707" y="508" font-size="18" fill="#94a3b8" text-anchor="middle">organized under the auspices of ${safeClubName}</text>

  <!-- Credentials Box / QR / Seal / Dual Signatures Area -->
  <rect x="100" y="540" width="1214" height="340" rx="16" fill="#0f172a" fill-opacity="0.92" stroke="#334155" stroke-width="2"/>

  <!-- Top Strip: Metadata Details + QR Code -->
  <g transform="translate(140, 565)">
    <!-- Metadata Column 1 -->
    <text x="0" y="20" font-size="11" font-weight="700" letter-spacing="1.5" fill="#64748b">CREDENTIAL ID</text>
    <text x="0" y="44" font-family="'Courier New', monospace" font-size="20" font-weight="900" fill="#fbbf24">${safeCertId}</text>

    <!-- Metadata Column 2 -->
    <text x="280" y="20" font-size="11" font-weight="700" letter-spacing="1.5" fill="#64748b">ISSUED DATE</text>
    <text x="280" y="44" font-size="16" font-weight="600" fill="#e2e8f0">${issueDate}</text>

    <!-- Metadata Column 3 -->
    <text x="520" y="20" font-size="11" font-weight="700" letter-spacing="1.5" fill="#64748b">VERIFICATION STATUS</text>
    <text x="520" y="44" font-size="15" font-weight="800" fill="#10b981">AUTHENTICATED &amp; VALID</text>
  </g>

  <line x1="140" y1="640" x2="1274" y2="640" stroke="#334155" stroke-width="1.5" stroke-dasharray="6,4"/>

  <!-- Bottom Section: Dual Signatures + Central Gold Seal + QR Frame -->
  
  <!-- 1. Left: Club Admin / Lead Signatory -->
  <g transform="translate(150, 680)">
    <!-- Stylized Calligraphy Signature Vector Path -->
    <path d="M 10 30 C 25 5, 45 45, 60 15 C 75 -10, 90 35, 110 10 C 130 -15, 145 25, 170 5 M 20 40 L 190 35 M 40 -5 C 50 20, 60 55, 75 35" stroke="#fbbf24" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="100" y="32" font-family="'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive, sans-serif" font-size="30" font-style="italic" fill="#fde68a" text-anchor="middle">${safeSig1Name}</text>
    <line x1="0" y1="48" x2="200" y2="48" stroke="#64748b" stroke-width="1.5"/>
    <text x="100" y="66" font-size="13" font-weight="800" fill="#e2e8f0" text-anchor="middle">${safeSig1Title}</text>
    <text x="100" y="82" font-size="11" fill="#94a3b8" text-anchor="middle">${safeClubName} Directorate</text>
  </g>

  <!-- 2. Center: Official Authenticity Seal -->
  <g transform="translate(707, 740)">
    <circle r="60" fill="url(#goldBadgeGrad)" stroke="#fde68a" stroke-width="3.5"/>
    <circle r="52" fill="none" stroke="#78350f" stroke-width="2" stroke-dasharray="6,4"/>
    <circle r="44" fill="none" stroke="#78350f" stroke-width="1"/>
    <text y="-14" font-size="10" font-weight="900" letter-spacing="2" fill="#78350f" text-anchor="middle">★ OFFICIAL ★</text>
    <text y="10" font-size="18" font-weight="900" letter-spacing="2" fill="#0f172a" text-anchor="middle">SEAL</text>
    <text y="28" font-size="10" font-weight="900" letter-spacing="1.5" fill="#78350f" text-anchor="middle">AUTHENTIC</text>
  </g>

  <!-- 3. Right: Campus Super Admin / Dean Signatory -->
  <g transform="translate(930, 680)">
    <!-- Stylized Dean Signature Vector Path -->
    <path d="M 10 25 C 30 -5, 45 40, 70 10 C 95 -20, 110 35, 140 5 C 160 -15, 175 25, 200 15 M 15 35 L 195 35" stroke="#38bdf8" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="100" y="32" font-family="'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive, sans-serif" font-size="30" font-style="italic" fill="#7dd3fc" text-anchor="middle">${safeSig2Name}</text>
    <line x1="0" y1="48" x2="200" y2="48" stroke="#64748b" stroke-width="1.5"/>
    <text x="100" y="66" font-size="13" font-weight="800" fill="#e2e8f0" text-anchor="middle">${safeSig2Title}</text>
    <text x="100" y="82" font-size="11" fill="#94a3b8" text-anchor="middle">Office of Student Affairs</text>
  </g>

  <!-- Far Right QR Stamp -->
  <g transform="translate(1170, 560)">
    <rect x="0" y="0" width="120" height="145" rx="10" fill="#ffffff" stroke="#f59e0b" stroke-width="2"/>
    <image href="data:image/png;base64,${qrBase64}" x="10" y="10" width="100" height="100"/>
    <text x="60" y="125" font-size="8" font-weight="800" fill="#0f172a" text-anchor="middle">VERIFY QR</text>
    <text x="60" y="137" font-family="'Courier New', monospace" font-size="7" font-weight="700" fill="#64748b" text-anchor="middle">${safeCertId}</text>
  </g>

  <!-- Bottom Brand Footer -->
  <text x="707" y="948" font-size="13" fill="#64748b" text-anchor="middle">Campus Club Management SaaS • Standard A4 High-Definition Certificate of Record</text>
</svg>`;

  const subject = `🏆 Official Certificate Attached: ${attendeeName} - ${eventTitle} (${clubName})`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #060912; color: #ffffff; padding: 20px;">
      
      <!-- Top Congratulatory Header -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #fbbf24; margin: 0; font-size: 22px; font-weight: 800;">🎉 Congratulations, ${attendeeName}!</h2>
        <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Your official certificate for <strong>${eventTitle}</strong> is attached directly to this email.</p>
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 8px; padding: 8px 16px; display: inline-block; margin-top: 10px;">
          <span style="color: #34d399; font-size: 12px; font-weight: 700;">📎 Attached: Certificate_${certificateId}.svg (Official E-Certificate)</span>
        </div>
      </div>

      <!-- High-Res Visual E-Certificate Card -->
      <div style="background: linear-gradient(145deg, #0f172a 0%, #0b1022 100%); border: 4px solid #d97706; border-radius: 20px; padding: 36px 28px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); position: relative; overflow: hidden;">
        
        <!-- Inner Gold Border Accent -->
        <div style="border: 1px dashed rgba(251, 191, 36, 0.4); border-radius: 14px; padding: 28px 20px;">
          
          <!-- Club & Badge Header -->
          <div style="margin-bottom: 16px;">
            <div style="display: inline-block; background: rgba(245, 158, 11, 0.15); border: 2px solid #f59e0b; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; margin-bottom: 10px;">🏆</div>
            <h4 style="margin: 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">${clubName}</h4>
            <h1 style="margin: 6px 0 0 0; color: #fbbf24; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">Certificate of Completion</h1>
          </div>

          <p style="margin: 0 0 16px 0; color: #64748b; font-size: 12px; font-style: italic;">This credential officially verifies that</p>
          
          <!-- Recipient Name -->
          <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 0.5px; text-decoration: underline; text-decoration-color: #f59e0b; text-underline-offset: 6px;">${attendeeName}</h2>
          
          <p style="margin: 0 auto 24px auto; color: #cbd5e1; font-size: 13px; line-height: 1.6; max-width: 480px;">
            has successfully attended, participated, and completed all required activities for the event 
            <strong style="color: #fbbf24;">${eventTitle}</strong> organized by <strong>${clubName}</strong>.
          </p>

          <!-- Certificate Metadata Grid with QR Code -->
          <table style="width: 100%; max-width: 480px; margin: 0 auto 16px auto; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 12px 0;">
            <tr>
              <td style="text-align: left; vertical-align: middle; width: 60%;">
                <div style="margin-bottom: 6px;">
                  <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; display: block;">Credential ID</span>
                  <span style="font-size: 13px; font-family: monospace; font-weight: 800; color: #fbbf24;">${certificateId}</span>
                </div>
                <div style="margin-bottom: 6px;">
                  <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; display: block;">Issued On</span>
                  <span style="font-size: 12px; color: #e2e8f0; font-weight: 600;">${issueDate}</span>
                </div>
                <div>
                  <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; display: block;">Verification Status</span>
                  <span style="font-size: 11px; color: #10b981; font-weight: 700;">✅ Authenticated &amp; Valid</span>
                </div>
              </td>
              <td style="text-align: right; vertical-align: middle; width: 40%;">
                <div style="background: #ffffff; padding: 6px; border-radius: 10px; display: inline-block; border: 2px solid #fbbf24;">
                  <img src="${qrDataUrl}" alt="Verification QR" style="width: 85px; height: 85px; display: block;" />
                </div>
                <span style="display: block; font-size: 9px; color: #94a3b8; font-family: monospace; margin-top: 4px;">Scan to Verify</span>
              </td>
            </tr>
          </table>

          <!-- Official Signatures Table in Email -->
          <table style="width: 100%; max-width: 480px; margin: 16px auto 20px auto; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">
            <tr>
              <td style="text-align: center; width: 50%; padding: 0 8px;">
                <div style="font-family: 'Brush Script MT', 'Dancing Script', cursive; font-size: 22px; color: #fbbf24; font-style: italic; margin-bottom: 4px;">${safeSig1Name}</div>
                <div style="border-top: 1px solid #475569; padding-top: 4px;">
                  <span style="display: block; font-size: 11px; font-weight: 700; color: #e2e8f0;">${safeSig1Title}</span>
                  <span style="display: block; font-size: 9px; color: #94a3b8;">${clubName} Lead</span>
                </div>
              </td>
              <td style="text-align: center; width: 50%; padding: 0 8px;">
                <div style="font-family: 'Brush Script MT', 'Dancing Script', cursive; font-size: 22px; color: #38bdf8; font-style: italic; margin-bottom: 4px;">${safeSig2Name}</div>
                <div style="border-top: 1px solid #475569; padding-top: 4px;">
                  <span style="display: block; font-size: 11px; font-weight: 700; color: #e2e8f0;">${safeSig2Title}</span>
                  <span style="display: block; font-size: 9px; color: #94a3b8;">Dean of Student Affairs</span>
                </div>
              </td>
            </tr>
          </table>

          <!-- Direct Verification Link Button -->
          <div style="margin-top: 20px;">
            <a href="${certUrl}" style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #0f172a; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 900; font-size: 13px; display: inline-block; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35);">
              Verify Credential Online →
            </a>
          </div>

        </div>
      </div>

      <!-- Footer Info -->
      <div style="text-align: center; margin-top: 20px; color: #475569; font-size: 11px;">
        <p style="margin: 0 0 4px 0;">Official Campus Club Management SaaS • E-Certificate Engine</p>
        <p style="margin: 0;">Online Verification: <a href="${certUrl}" style="color: #38bdf8;">${certUrl}</a></p>
      </div>

    </div>
  `;

  // Attach ONLY the Certificate document itself (No separate Gate Pass QR attachment)
  const attachments = [
    {
      filename: `Certificate_${certificateId}.svg`,
      content: Buffer.from(certificateSvg, 'utf-8'),
      contentType: 'image/svg+xml'
    }
  ];

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
        attachments
      });
      console.log(`✅ Live Gmail Certificate Attachment dispatched to: ${to} (${certificateId})`);
      return { success: true, simulated: false };
    } catch (err) {
      console.error('❌ Gmail SMTP certificate dispatch failed:', err.message);
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
          content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
          contentType: a.contentType || 'image/svg+xml'
        }))
      });
      console.log(`✅ Resend certificate dispatched to: ${to}`);
      return { success: true, simulated: false };
    } catch (err) {
      console.error('Resend certificate dispatch error:', err.message);
    }
  }

  return { success: true, simulated: true };
};

// Handler to retrieve registrations roster with optional search and event filtering
const getRegistrationsHandler = async (req, res) => {
  try {
    const { search, eventId } = req.query;
    let query = { tenantId: req.tenant._id };

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      query.eventId = new mongoose.Types.ObjectId(eventId);
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { passId: { $regex: s, $options: 'i' } },
        { qid: { $regex: s, $options: 'i' } },
        { rollNumber: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { department: { $regex: s, $options: 'i' } },
        { certificateId: { $regex: s, $options: 'i' } }
      ];
    }

    const registrations = await Registration.find(query)
      .populate('eventId', 'title date location ticketPrice')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve registrations', error: error.message });
  }
};

// GET /api/club/:slug/registrations and GET /api/club/:slug
router.get('/registrations', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER'), getRegistrationsHandler);
router.get('/', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER'), getRegistrationsHandler);

// GET /api/club/:slug/certificate/:certificateId - Get certificate data for attendee (only if issued)
router.get('/certificate/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const registration = await Registration.findOne({
      tenantId: req.tenant._id,
      certificateId: certificateId.trim().toUpperCase()
    }).populate('eventId');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Require certificate to be explicitly issued/verified by admin or through check-in approval
    if (!registration.certificateIssued) {
      return res.status(403).json({ 
        success: false, 
        locked: true,
        message: 'Certificate has not been issued yet. Attendance check-in and Admin verification are required after event completion.' 
      });
    }

    res.json({
      success: true,
      data: {
        certificateId: registration.certificateId,
        attendeeName: registration.name,
        qid: registration.qid || registration.rollNumber || '',
        rollNumber: registration.qid || registration.rollNumber || '',
        department: registration.department || '',
        year: registration.year || '',
        email: registration.email,
        phone: registration.phone || '',
        checkedIn: registration.checkedIn,
        checkInTime: registration.checkInTime,
        certificateIssued: registration.certificateIssued,
        issuedAt: registration.checkInTime || registration.createdAt,
        event: {
          id: registration.eventId._id,
          title: registration.eventId.title,
          description: registration.eventId.description,
          date: registration.eventId.date,
          location: registration.eventId.location
        },
        club: {
          name: req.tenant.name,
          slug: req.tenant.slug,
          primaryColor: req.tenant.primaryColor,
          secondaryColor: req.tenant.secondaryColor,
          logo: req.tenant.logo,
          certificateTemplateUrl: req.tenant.certificateTemplateUrl || '',
          certificateStyle: req.tenant.certificateStyle || 'default_dark',
          signatory1Name: req.tenant.signatory1Name || 'Alex Mercer',
          signatory1Title: req.tenant.signatory1Title || 'Club Lead / Admin',
          signatory2Name: req.tenant.signatory2Name || 'Dr. V. K. Sharma',
          signatory2Title: req.tenant.signatory2Title || 'Campus Super Admin / Dean'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve certificate', error: error.message });
  }
});

// GET /api/club/:slug/certificate-settings - Retrieve club certificate template & signatory configs
router.get('/certificate-settings', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenant._id);
    res.json({
      success: true,
      data: {
        certificateTemplateUrl: tenant.certificateTemplateUrl || '',
        certificateStyle: tenant.certificateStyle || 'default_dark',
        signatory1Name: tenant.signatory1Name || 'Alex Mercer',
        signatory1Title: tenant.signatory1Title || 'Club Lead / Admin',
        signatory2Name: tenant.signatory2Name || 'Dr. V. K. Sharma',
        signatory2Title: tenant.signatory2Title || 'Campus Super Admin / Dean'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve certificate settings', error: err.message });
  }
});

// PUT /api/club/:slug/certificate-settings - Update custom certificate template & signatory configs
router.put('/certificate-settings', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { certificateTemplateUrl, certificateStyle, signatory1Name, signatory1Title, signatory2Name, signatory2Title } = req.body;
    
    const updateData = {};
    if (certificateTemplateUrl !== undefined) updateData.certificateTemplateUrl = certificateTemplateUrl;
    if (certificateStyle !== undefined) updateData.certificateStyle = certificateStyle;
    if (signatory1Name !== undefined) updateData.signatory1Name = signatory1Name;
    if (signatory1Title !== undefined) updateData.signatory1Title = signatory1Title;
    if (signatory2Name !== undefined) updateData.signatory2Name = signatory2Name;
    if (signatory2Title !== undefined) updateData.signatory2Title = signatory2Title;

    const updatedTenant = await Tenant.findByIdAndUpdate(req.tenant._id, updateData, { new: true });
    
    res.json({
      success: true,
      message: 'Certificate template settings updated successfully',
      data: {
        certificateTemplateUrl: updatedTenant.certificateTemplateUrl || '',
        certificateStyle: updatedTenant.certificateStyle || 'default_dark',
        signatory1Name: updatedTenant.signatory1Name,
        signatory1Title: updatedTenant.signatory1Title,
        signatory2Name: updatedTenant.signatory2Name,
        signatory2Title: updatedTenant.signatory2Title
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update certificate settings', error: err.message });
  }
});

// PUT /api/club/:slug/registrations/:registrationId/toggle-certificate - Admin toggle certificate issuance
router.put('/registrations/:registrationId/toggle-certificate', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER'), async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registration.findOne({ _id: registrationId, tenantId: req.tenant._id });
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    registration.certificateIssued = !registration.certificateIssued;
    await registration.save();

    // Auto-dispatch certificate email to student if newly issued
    if (registration.certificateIssued) {
      const event = await Event.findById(registration.eventId);
      dispatchCertificateEmail({ registration, event, tenant: req.tenant }).catch(err => {
        console.error('Certificate email dispatch error:', err.message);
      });
    }

    res.json({
      success: true,
      message: `Certificate ${registration.certificateIssued ? 'issued and emailed' : 'revoked'} successfully`,
      certificateIssued: registration.certificateIssued
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update certificate status', error: error.message });
  }
});

// POST /api/club/:slug/events/:eventId/bulk-issue-certificates - Bulk issue certificates to checked-in attendees
router.post('/events/:eventId/bulk-issue-certificates', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER'), async (req, res) => {
  try {
    const { eventId } = req.params;

    // Find all checked-in attendees who don't have their certificate yet
    const attendeesToIssue = await Registration.find({
      tenantId: req.tenant._id,
      eventId: eventId,
      checkedIn: true,
      certificateIssued: false
    });

    const result = await Registration.updateMany(
      { 
        tenantId: req.tenant._id, 
        eventId: eventId,
        checkedIn: true,
        certificateIssued: false
      },
      { $set: { certificateIssued: true } }
    );

    // Dispatch certificate emails to all verified attendees in background
    if (attendeesToIssue.length > 0) {
      Event.findById(eventId).then(event => {
        attendeesToIssue.forEach(reg => {
          reg.certificateIssued = true;
          dispatchCertificateEmail({ registration: reg, event, tenant: req.tenant }).catch(err => {
            console.error(`Failed to email certificate to ${reg.email}:`, err.message);
          });
        });
      });
    }

    res.json({
      success: true,
      message: `Successfully issued & dispatched certificates to ${result.modifiedCount} verified attendee(s)`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to bulk issue certificates', error: error.message });
  }
});

// POST /api/club/:slug/scanner/validate - Atomic ticket validation & check-in (Supports QR JWT & Manual Pass ID / Email)
router.post('/scanner/validate', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER'), async (req, res) => {
  try {
    const { passToken } = req.body;
    if (!passToken || !passToken.trim()) {
      return res.status(400).json({ success: false, message: 'Ticket pass code or token is required' });
    }

    const trimmedInput = passToken.trim();
    let registrationId = null;
    let eventId = null;

    // 1. Try decoding as JWT signed pass token (from camera QR scanner)
    try {
      const decoded = jwt.verify(trimmedInput, process.env.PASS_JWT_SECRET || 'super_secret_event_pass_key_54321');
      if (decoded && decoded.type === 'EVENT_PASS') {
        if (decoded.tenantId !== req.tenant._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Invalid Ticket: This ticket belongs to another campus club.'
          });
        }
        registrationId = decoded.registrationId;
        eventId = decoded.eventId;
      }
    } catch (jwtErr) {
      // 2. If not a valid JWT token, search by human-readable Pass ID, Email, or Q.ID
      const matchedReg = await Registration.findOne({
        tenantId: req.tenant._id,
        $or: [
          { passId: trimmedInput.toUpperCase() },
          { email: trimmedInput.toLowerCase() },
          { qid: trimmedInput },
          { rollNumber: trimmedInput },
          { certificateId: trimmedInput.toUpperCase() }
        ]
      });

      if (!matchedReg) {
        return res.status(404).json({
          success: false,
          message: 'Invalid Pass: No registration found matching this Pass ID, Email, or Q.ID.'
        });
      }

      registrationId = matchedReg._id;
      eventId = matchedReg.eventId;
    }

    // Atomic update to mark check-in (prevents duplicate scanner race conditions)
    const checkedInRegistration = await Registration.findOneAndUpdate(
      {
        _id: registrationId,
        tenantId: req.tenant._id,
        checkedIn: false
      },
      {
        $set: {
          checkedIn: true,
          checkInTime: new Date()
        }
      },
      { new: true }
    ).populate('eventId', 'title date location');

    // If update yields null: it's either an invalid registration, or already checked in
    if (!checkedInRegistration) {
      const existingReg = await Registration.findOne({ _id: registrationId, tenantId: req.tenant._id })
        .populate('eventId', 'title');
      if (!existingReg) {
        return res.status(404).json({ success: false, message: 'Ticket registration not found' });
      }

      if (existingReg.checkedIn) {
        return res.status(400).json({
          success: false,
          alreadyCheckedIn: true,
          message: 'Duplicate Gate Scan: Ticket has already been checked in!',
          data: {
            name: existingReg.name,
            email: existingReg.email,
            passId: existingReg.passId,
            certificateId: existingReg.certificateId,
            checkInTime: existingReg.checkInTime,
            eventTitle: existingReg.eventId?.title
          }
        });
      }
    }

    // Atomically increment Event attendance count
    if (eventId) {
      await Event.updateOne({ _id: eventId }, { $inc: { attendanceCount: 1 } });
    }

    res.json({
      success: true,
      message: 'Access Granted: Attendee checked in successfully',
      data: {
        registrationId: checkedInRegistration._id,
        name: checkedInRegistration.name,
        email: checkedInRegistration.email,
        phone: checkedInRegistration.phone,
        qid: checkedInRegistration.qid || checkedInRegistration.rollNumber,
        department: checkedInRegistration.department,
        passId: checkedInRegistration.passId,
        certificateId: checkedInRegistration.certificateId,
        checkedIn: checkedInRegistration.checkedIn,
        checkInTime: checkedInRegistration.checkInTime,
        eventTitle: checkedInRegistration.eventId?.title
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Ticket validation failed', error: error.message });
  }
});

// GET /api/club/:slug/admin/dashboard - Aggregated analytics statistics
router.get('/admin/dashboard', authenticate, authorize('CLUB_ADMIN', 'ORGANIZER'), async (req, res) => {
  try {
    const tenantId = req.tenant._id;

    // 1. High-level aggregates
    const events = await Event.find({ tenantId });
    const totalEvents = events.length;

    const totalRegistrations = events.reduce((sum, e) => sum + e.registrationCount, 0);
    const totalAttendance = events.reduce((sum, e) => sum + e.attendanceCount, 0);
    const totalPageViews = events.reduce((sum, e) => sum + e.pageViews, 0);

    // 2. Conversion metrics (Registrations vs Views)
    const conversionChartData = events.map(e => ({
      eventId: e._id,
      title: e.title,
      views: e.pageViews,
      registrations: e.registrationCount,
      conversionRate: e.pageViews > 0 ? Math.round((e.registrationCount / e.pageViews) * 100) : 0
    }));

    // 3. Peak arrival hours: Group registrations check-in times by hour (timezone adjusted locally)
    const peakArrivals = await Registration.aggregate([
      { 
        $match: { 
          tenantId, 
          checkedIn: true, 
          checkInTime: { $ne: null } 
        } 
      },
      {
        $project: {
          hour: { $hour: { date: "$checkInTime", timezone: "Asia/Kolkata" } }
        }
      },
      {
        $group: {
          _id: "$hour",
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format peak arrivals hourly data for Recharts (hours 0-23)
    const hourLabels = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      scans: 0
    }));
    
    peakArrivals.forEach(pa => {
      if (pa._id >= 0 && pa._id < 24) {
        hourLabels[pa._id].scans = pa.count;
      }
    });

    // 4. Registration trends: registrations count grouped by event
    const eventStats = events.map(e => ({
      name: e.title,
      Registrations: e.registrationCount,
      Attendance: e.attendanceCount,
      Capacity: e.capacity
    }));

    // Get 5 recent registrations
    const recentRegistrations = await Registration.find({ tenantId })
      .populate('eventId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          totalRegistrations,
          totalAttendance,
          totalPageViews,
          attendanceRate: totalRegistrations > 0 ? Math.round((totalAttendance / totalRegistrations) * 100) : 0
        },
        conversionChartData,
        peakHoursData: hourLabels,
        eventStats,
        recentRegistrations
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve analytics', error: error.message });
  }
});

module.exports = router;
