import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Mail, User, ShieldCheck, Ticket, Download, 
  MailCheck, Award, Target, Cpu, Music, Radio, Sparkles, 
  ArrowLeft, CheckCircle2, Phone, GraduationCap, Building, 
  CreditCard, QrCode, Share2, Copy, Clock, AlertCircle 
} from 'lucide-react';

const LOGO_ICONS = {
  Award: Award,
  Target: Target,
  Cpu: Cpu,
  Music: Music,
  Radio: Radio
};

function EventRegister() {
  const { slug, eventId } = useParams();
  const { club } = useOutletContext();
  
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState('');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [qid, setQid] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Eng.');
  const [year, setYear] = useState('3rd Year');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Successful registration state
  const [passData, setPassData] = useState(null);

  useEffect(() => {
    fetch(`/api/club/${slug}/events/${eventId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEvent(data.data);
        } else {
          setEventError(data.message || 'Failed to load event details');
        }
        setLoadingEvent(false);
      })
      .catch(err => {
        setEventError('Network error loading event');
        setLoadingEvent(false);
      });
  }, [slug, eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/club/${slug}/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          qid,
          rollNumber: qid, 
          phone, 
          department, 
          year 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.requiresPayment) {
          const { keyId, amount, currency, orderId, clubName, eventTitle } = data.paymentDetails;
          
          const options = {
            key: keyId,
            amount: amount,
            currency: currency,
            name: clubName,
            description: `Entry ticket for ${eventTitle}`,
            order_id: orderId,
            config_id: "config_TWGl9hHxjnhGzx",
            handler: async function (response) {
              setIsSubmitting(true);
              try {
                const verifyRes = await fetch(`/api/club/${slug}/events/${eventId}/verify-payment`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name,
                    email,
                    qid,
                    rollNumber: qid,
                    phone,
                    department,
                    year,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });
                
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  setPassData(verifyData.data);
                } else {
                  setSubmitError(verifyData.message || 'Payment verification failed');
                }
              } catch (err) {
                setSubmitError('Verification connection error. Do not close this tab.');
              } finally {
                setIsSubmitting(false);
              }
            },
            prefill: {
              name: name,
              email: email,
              contact: phone
            },
            theme: {
              color: club.primaryColor || "#3b82f6"
            },
            modal: {
              ondismiss: function() {
                setIsSubmitting(false);
                setSubmitError('Payment was cancelled.');
              }
            }
          };
          
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          setPassData(data.data);
        }
      } else {
        setSubmitError(data.message || 'Registration failed');
      }
    } catch (err) {
      setSubmitError('Failed to connect to registration server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!passData || !passData.qrCode) return;
    const link = document.createElement('a');
    link.href = passData.qrCode;
    link.download = `${event.title.replace(/\s+/g, '_')}_pass.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const IconComp = LOGO_ICONS[club.logo] || Award;

  const isDeadlinePassed = event && event.registrationDeadline && new Date() > new Date(event.registrationDeadline);
  const isCapacityFull = event && event.registrationCount >= event.capacity;
  const isRegistrationClosed = isDeadlinePassed || isCapacityFull;

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#060912]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-primary border-slate-800 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: 'var(--primary)' }}></div>
          <p className="text-slate-400 font-medium text-sm">Resolving event coordinates...</p>
        </div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060912] text-center px-4">
        <div className="p-8 glass-card rounded-3xl max-w-md w-full border border-red-500/20 shadow-2xl">
          <span className="text-5xl">❌</span>
          <h2 className="text-xl font-bold font-heading text-red-400 mt-4 mb-2">Event Not Found</h2>
          <p className="text-slate-400 text-xs mb-6">{eventError}</p>
          <Link 
            to={`/club/${slug}`} 
            className="px-5 py-2.5 bg-primary text-slate-950 font-bold rounded-xl transition text-xs inline-block shadow-lg" 
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Back to {club.name}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-grid-dots relative overflow-hidden">
      {/* Background Glows */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none neon-pulse-glow"
        style={{ backgroundColor: 'var(--primary)' }}
      ></div>

      {/* Mini Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to={`/club/${slug}`} className="flex items-center gap-2 group text-xs text-slate-400 font-semibold hover:text-white transition">
            <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-1" />
            <span>Back to {club.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
              style={{ 
                color: 'var(--primary)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--primary-glow)'
              }}
            >
              <IconComp className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs md:text-sm font-heading text-slate-200 truncate max-w-[200px] sm:max-w-none">{event.title}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-10 relative z-10">
        {!passData ? (
          /* Registration Form Grid */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Event Spotlight Card (5 cols) */}
            <div className="md:col-span-5 glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
              <div 
                className="absolute -right-16 -top-16 w-40 h-40 rounded-full blur-2xl opacity-25 pointer-events-none"
                style={{ backgroundColor: 'var(--primary)' }}
              ></div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 border border-white/10 mb-4 text-slate-300">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Event Spotlight</span>
              </div>

              <h2 className="text-2xl font-black font-heading text-white mb-3 leading-tight">{event.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6 font-normal">
                {event.description || 'Join us for this exciting campus activity. Reserve your seat and receive your authenticated entry token.'}
              </p>
              
              <div className="space-y-4 pt-5 border-t border-white/10">
                <div className="flex items-start gap-3 text-xs text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Date & Time</span>
                    <span className="font-semibold">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {event.registrationDeadline && (
                  <div className="flex items-start gap-3 text-xs text-slate-300">
                    <div className={`w-7 h-7 rounded-lg ${isDeadlinePassed ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'} flex items-center justify-center shrink-0`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Registration Deadline</span>
                      <span className={`font-semibold ${isDeadlinePassed ? 'text-red-400' : 'text-amber-300'}`}>
                        {new Date(event.registrationDeadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {isDeadlinePassed ? ' (Expired)' : ''}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 text-xs text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Venue Location</span>
                    <span className="font-semibold line-clamp-1">{event.location}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-slate-400">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Admission Fee</span>
                    <span className="font-bold text-sm" style={{ color: event.ticketPrice === 0 ? '#10b981' : 'var(--primary)' }}>
                      {event.ticketPrice === 0 ? 'FREE ADMISSION' : `₹${event.ticketPrice}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form / Closed Container (7 cols) */}
            {isRegistrationClosed ? (
              <div className="md:col-span-7 glass-card p-8 md:p-12 rounded-3xl border border-red-500/20 shadow-2xl relative overflow-hidden text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4 shadow-lg">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-heading text-red-400 mb-2">Registration Closed</h3>
                <p className="text-xs text-slate-300 max-w-sm mb-6 leading-relaxed">
                  {isDeadlinePassed 
                    ? `The registration window for this event closed on ${new Date(event.registrationDeadline).toLocaleString()}. New registrations are no longer permitted.`
                    : `This event has reached full capacity of ${event.capacity} seats. Registration is officially closed.`
                  }
                </p>
                <Link
                  to={`/club/${slug}`}
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs transition shadow-md"
                >
                  Explore Other Events
                </Link>
              </div>
            ) : (
              <div className="md:col-span-7 glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                <h3 className="text-xl font-bold font-heading text-white mb-1">Registration Form</h3>
                <p className="text-xs text-slate-400 mb-6">Complete your student attendee profile to generate your pass.</p>

                {submitError && (
                  <div className="p-3.5 text-xs bg-red-950/50 border border-red-500/20 text-red-400 rounded-xl mb-4 animate-fade-in">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Ankit Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        placeholder="e.g. ankit@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner transition"
                        required
                      />
                    </div>
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Q.ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. 28435600123 / Q-901"
                      value={qid}
                      onChange={(e) => setQid(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner transition font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp / Phone</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department / Branch</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary shadow-inner transition"
                    >
                      <option value="Computer Science & Eng.">Computer Science & Eng.</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Comm.">Electronics & Comm.</option>
                      <option value="Mechanical Eng.">Mechanical Eng.</option>
                      <option value="Civil Eng.">Civil Eng.</option>
                      <option value="Electrical & Electronics">Electrical & Electronics</option>
                      <option value="Business Administration / MBA">Management / MBA</option>
                      <option value="Other Department">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary shadow-inner transition"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 py-3.5 rounded-2xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-xl"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>Securing Seat Allocation...</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>{event.ticketPrice > 0 ? `Pay ₹${event.ticketPrice} & Book Pass` : 'Confirm Free Registration'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* VIP Boarding Pass Entry Card Overlay */
          <div className="flex flex-col items-center justify-center animate-fade-in">
            <div className="w-full max-w-md rounded-3xl overflow-hidden glass-card relative border border-white/15 shadow-2xl mb-6">
              
              {/* Top Banner with Brand Glow */}
              <div 
                className="p-6 relative flex flex-col items-center justify-center text-center border-b-2 border-dashed border-white/10"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 100%)' 
                }}
              >
                <div 
                  className="absolute top-0 w-full h-1.5"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
                ></div>

                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 mt-2 shadow-lg"
                  style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                
                <h3 className="font-black text-white text-xl font-heading tracking-tight uppercase">VIP Entry Pass</h3>
                <span className="text-[11px] text-slate-300 font-bold mt-1 font-mono uppercase tracking-widest bg-slate-950/80 px-3 py-1 rounded-full border border-white/10">
                  {passData.passId}
                </span>
              </div>

              {/* Middle Section (Attendee & Event Meta) */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Event</span>
                  <h4 className="font-bold text-white text-base font-heading">{event.title}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3.5 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Attendee</span>
                    <p className="text-xs text-slate-200 font-bold">{name}</p>
                    {qid && <p className="text-[10px] text-amber-400 font-mono mt-0.5">Q.ID: {qid}</p>}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Admission</span>
                    <p className="text-xs text-emerald-400 font-bold font-mono">{event.ticketPrice === 0 ? 'FREE' : `₹${event.ticketPrice}`}</p>
                    {department && <p className="text-[10px] text-slate-400 truncate mt-0.5">{department}</p>}
                  </div>
                </div>

                <div className="text-xs text-slate-300 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Date</span>
                    <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Location</span>
                    <p className="font-medium truncate max-w-[160px]">{event.location}</p>
                  </div>
                </div>

                {/* QR Code Container with Neon Target Corners */}
                <div className="flex flex-col items-center justify-center py-5 bg-slate-950/90 rounded-2xl border border-white/10 mt-2 relative overflow-hidden">
                  <img 
                    src={passData.qrCode} 
                    alt="Entry QR Pass" 
                    className="w-44 h-44 border-4 border-white/15 rounded-2xl shadow-2xl bg-white p-1"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold mt-3 uppercase tracking-widest font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Present at gate scanner
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download Pass
                  </button>
                  <Link
                    to={`/club/${slug}`}
                    className="flex-1 py-3 rounded-2xl text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition shadow-lg"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    Club Home
                  </Link>
                </div>

                {/* Certificate Status Section */}
                {passData.certificateIssued ? (
                  <Link
                    to={`/club/${slug}/certificate/${passData.certificateId}`}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>View / Claim E-Certificate ({passData.certificateId})</span>
                  </Link>
                ) : (
                  <div className="w-full p-3 rounded-2xl bg-slate-900/80 border border-amber-500/20 text-center flex items-center justify-center gap-2 text-slate-300 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>E-Certificate:</strong> Will unlock after event check-in & admin verification</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mock Simulated Inbox Card */}
            {passData.emailDetails && passData.emailDetails.simulated && (
              <div className="w-full max-w-md glass-card border border-white/10 rounded-3xl p-6 relative overflow-hidden bg-slate-950/70">
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MailCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">Email Dispatch Simulated</h5>
                    <p className="text-[10px] text-slate-500">Ticket sent to {passData.emailDetails.to}</p>
                  </div>
                </div>

                <div className="text-xs border border-white/5 rounded-2xl bg-slate-900/80 p-3.5 font-mono text-slate-400 space-y-1">
                  <p><span className="text-slate-500">Subject:</span> {passData.emailDetails.subject}</p>
                  <p className="text-[11px] text-slate-300 font-sans pt-1.5 border-t border-white/5">{passData.emailDetails.body}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default EventRegister;
