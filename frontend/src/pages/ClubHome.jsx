import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams, Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Users, Ticket, ArrowRight, ShieldAlert, 
  Award, Target, Cpu, Music, Radio, Sparkles, Search, CheckCircle2,
  Clock, ShieldCheck, ChevronRight, QrCode, Download, Copy, Check, Share2, X
} from 'lucide-react';
import QRCode from 'qrcode';

const LOGO_ICONS = {
  Award: Award,
  Target: Target,
  Cpu: Cpu,
  Music: Music,
  Radio: Radio
};

function ClubHome() {
  const { slug } = useParams();
  const { club } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'FREE', 'PAID'
  const [searchQuery, setSearchQuery] = useState('');

  // Club QR Code modal states
  const [showQrModal, setShowQrModal] = useState(false);
  const [clubQrUrl, setClubQrUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [slug]);

  const fetchEvents = () => {
    setLoading(true);
    fetch(`/api/club/${slug}/events`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEvents(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
        setLoading(false);
      });
  };

  const handleOpenQr = async () => {
    setShowQrModal(true);
    setCopiedLink(false);
    try {
      const fullUrl = `${window.location.origin}/club/${slug}`;
      const urlData = await QRCode.toDataURL(fullUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setClubQrUrl(urlData);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  };

  const handleDownloadQr = () => {
    if (!clubQrUrl) return;
    const link = document.createElement('a');
    link.href = clubQrUrl;
    link.download = `${slug}_club_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/club/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const IconComp = LOGO_ICONS[club.logo] || Award;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'FREE') return matchesSearch && e.ticketPrice === 0;
    if (filterType === 'PAID') return matchesSearch && e.ticketPrice > 0;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen pb-20 bg-grid-dots relative overflow-hidden">
      {/* Dynamic Colored Ambient Glows */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none neon-pulse-glow"
        style={{ backgroundColor: 'var(--primary)' }}
      ></div>
      <div 
        className="absolute top-1/2 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none neon-pulse-glow"
        style={{ backgroundColor: 'var(--secondary)', animationDelay: '2s' }}
      ></div>

      {/* Dynamic Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group text-xs text-slate-400 font-semibold hover:text-white transition">
            <span>← Platform Hub</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition group-hover:scale-105"
              style={{ 
                color: 'var(--primary)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--primary-glow)'
              }}
            >
              <IconComp className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-sm md:text-base font-heading text-slate-100">{club.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenQr}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 hover:border-emerald-500/50 bg-white/5 hover:bg-emerald-500/10 text-slate-200 hover:text-emerald-400 flex items-center gap-1.5 transition shadow-sm"
              title="Share Club QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Club QR Code</span>
            </button>

            <Link
              to={`/club/${slug}/admin`}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-primary hover:bg-white/5 text-slate-200 transition"
            >
              Organizer Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-10 relative z-10">
        {/* Club Spotlight Hero Banner */}
        <section className="glass-card p-8 md:p-12 rounded-3xl relative overflow-hidden mb-12 border border-white/10 shadow-2xl">
          <div 
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: 'var(--primary)' }}
          ></div>
          
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-950/80 border border-white/10 mb-4 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span style={{ color: 'var(--primary)' }}>Official Campus Organization Portal</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-heading text-white tracking-tight leading-tight mb-4">
              Welcome to {club.name}
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal max-w-2xl">
              {club.description || 'Welcome to our campus events list. View upcoming activities, register online, and instantly download your cryptographically signed QR ticket.'}
            </p>

            {/* Quick Stats Pill */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-slate-200">{events.length}</span> Active Events
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Anti-Fraud Entry Passes</span>
              </div>
              <span>•</span>
              <button
                onClick={handleOpenQr}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold transition shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan & Share Club Link QR</span>
              </button>
            </div>
          </div>
        </section>

        {/* Events Feed Section with Search & Filter */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold font-heading text-white">Upcoming Club Events</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live pass availability and seat reservations</p>
            </div>

            {/* Filters and Search Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter Pills */}
              <div className="flex p-1 rounded-xl bg-slate-900 border border-white/10 text-xs">
                {['ALL', 'FREE', 'PAID'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                      filterType === type 
                        ? 'bg-white/10 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type === 'ALL' ? 'All Events' : type === 'FREE' ? 'Free' : 'Paid'}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-72 glass rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-card p-16 rounded-3xl text-center border-dashed border-white/10 max-w-md mx-auto">
              <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold font-heading text-slate-200">No Events Found</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                {searchQuery || filterType !== 'ALL' 
                  ? 'No events match your current search filters.' 
                  : 'This club currently has no published activities. Organizers can launch new events in the admin console.'}
              </p>
              <Link
                to={`/club/${slug}/admin`}
                className="px-5 py-2.5 rounded-xl text-slate-900 font-bold text-xs bg-primary hover:opacity-90 transition inline-block shadow-lg"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Organizer Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => {
                const remainingSlots = Math.max(0, event.capacity - event.registrationCount);
                const isDeadlinePassed = event.registrationDeadline && new Date() > new Date(event.registrationDeadline);
                const isSoldOut = remainingSlots === 0;
                const isClosed = isSoldOut || isDeadlinePassed;
                const capacityPercent = Math.min(100, Math.round((event.registrationCount / event.capacity) * 100));

                return (
                  <div
                    key={event._id}
                    className="glass-card glass-hover rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-xl transition-all duration-300 group"
                  >
                    {/* Top Section */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3.5">
                        <span 
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm"
                          style={{ 
                            color: event.ticketPrice === 0 ? '#10b981' : 'var(--primary)',
                            backgroundColor: event.ticketPrice === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                            borderColor: event.ticketPrice === 0 ? 'rgba(16, 185, 129, 0.2)' : 'var(--primary-glow)'
                          }}
                        >
                          {event.ticketPrice === 0 ? 'FREE ENTRY' : `₹${event.ticketPrice}`}
                        </span>

                        <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                          isClosed ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          <Users className="w-3.5 h-3.5" />
                          {isDeadlinePassed ? 'Deadline Passed' : isSoldOut ? 'Capacity Full' : `${remainingSlots} seats left`}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg font-heading text-white group-hover:text-primary transition line-clamp-1">
                        {event.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 min-h-[48px] leading-relaxed">
                        {event.description || 'Join us for this exciting campus activity with peer networking and hands-on participation.'}
                      </p>

                      {/* Capacity Progress Bar */}
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                          <span>Booked: {event.registrationCount} / {event.capacity}</span>
                          <span className="font-bold">{capacityPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${capacityPercent}%`,
                              backgroundColor: isClosed ? '#ef4444' : 'var(--primary)'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & CTA */}
                    <div className="px-6 py-4 bg-slate-950/60 border-t border-white/5 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{formatDate(event.date)}</span>
                      </div>

                      {event.registrationDeadline && (
                        <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-mono">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {isDeadlinePassed ? 'Registration closed' : `Closes: ${new Date(event.registrationDeadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>

                      {isClosed ? (
                        <button
                          disabled
                          className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-500 font-bold text-xs text-center cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isDeadlinePassed ? 'Registration Expired' : 'Capacity Full'}</span>
                        </button>
                      ) : (
                        <Link
                          to={`/club/${slug}/register/${event._id}`}
                          className="w-full mt-2 py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition shadow-lg"
                          style={{ backgroundColor: 'var(--primary)' }}
                        >
                          <span>Reserve Entry Pass</span>
                          <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* CLUB REGISTRATION LINK QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-3xl border border-white/20 overflow-hidden shadow-2xl p-6 relative text-center">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowQrModal(false);
                setClubQrUrl('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>Official Club QR Portal</span>
            </div>

            <h3 className="font-bold text-lg font-heading text-white line-clamp-1">
              {club.name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
              Scan with any mobile camera / Google Lens to browse upcoming events & book entry passes!
            </p>

            {/* Rendered QR Code Image Frame */}
            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mx-auto border-4 border-slate-800">
              {clubQrUrl ? (
                <img 
                  src={clubQrUrl} 
                  alt={`${club.name} QR`} 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Direct Link Preview & Copy */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between text-left">
              <span className="text-[10px] font-mono text-slate-300 truncate max-w-[200px]">
                {window.location.origin}/club/{slug}
              </span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px] font-bold border border-white/10"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={handleDownloadQr}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Poster QR</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubHome;
