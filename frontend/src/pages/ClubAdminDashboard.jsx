import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, CartesianGrid 
} from 'recharts';
import { 
  Layers, Plus, Trash2, Edit, Search, LogOut, CheckCircle, Clock, 
  Users, Calendar, Eye, QrCode, Sparkles, LayoutDashboard, Ticket, Settings,
  Download, Award, FileSpreadsheet, ExternalLink, Phone, GraduationCap,
  ArrowRight, ShieldCheck, TrendingUp, CheckCircle2, Copy, Palette, Upload,
  Image as ImageIcon, RotateCcw, Check, Share2, X
} from 'lucide-react';
import QRCode from 'qrcode';

function ClubAdminDashboard() {
  const { slug } = useParams();
  const { club } = useOutletContext();
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem(`${slug}_admin_token`));
  const [user, setUser] = useState(null);

  // Tabs: 'analytics', 'events', 'registrations'
  const [activeTab, setActiveTab] = useState('analytics');

  // Club QR Code Modal states
  const [showQrModal, setShowQrModal] = useState(false);
  const [clubQrUrl, setClubQrUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // API Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Events CRUD states
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    registrationDeadline: '',
    location: '',
    capacity: 50,
    ticketPrice: 0
  });

  // Registrations state
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterEvent, setSelectedFilterEvent] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isBulkIssuing, setIsBulkIssuing] = useState(false);

  // Certificate Template states
  const [certSettings, setCertSettings] = useState({
    certificateTemplateUrl: '',
    certificateStyle: 'default_dark',
    signatory1Name: 'Alex Mercer',
    signatory1Title: 'Club Lead / Admin',
    signatory2Name: 'Dr. V. K. Sharma',
    signatory2Title: 'Campus Super Admin / Dean'
  });
  const [loadingCertSettings, setLoadingCertSettings] = useState(false);
  const [savingCertSettings, setSavingCertSettings] = useState(false);
  const [certSaveSuccess, setCertSaveSuccess] = useState(false);

  useEffect(() => {
    const currentToken = localStorage.getItem(`${slug}_admin_token`);
    if (!currentToken) {
      navigate(`/club/${slug}/admin`);
      return;
    }
    setToken(currentToken);

    try {
      const storedUser = JSON.parse(localStorage.getItem(`${slug}_admin_user`));
      setUser(storedUser);
    } catch (e) {
      // Ignored
    }

    fetchAnalytics();
    fetchEvents();
    fetchRegistrations('', '');
  }, [slug]);

  const fetchAnalytics = async () => {
    setLoadingStats(true);
    setStatsError('');
    try {
      const currentToken = localStorage.getItem(`${slug}_admin_token`);
      const res = await fetch(`/api/club/${slug}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setStatsError(data.message || 'Failed to fetch analytics');
        if (res.status === 401 || res.status === 403) handleLogout();
      }
    } catch (err) {
      setStatsError('Connection to analytics backend failed');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/club/${slug}/events`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchRegistrations = async (search = searchQuery, eventId = selectedFilterEvent) => {
    setLoadingRegs(true);
    try {
      const currentToken = localStorage.getItem(`${slug}_admin_token`);
      const params = new URLSearchParams();
      if (search && search.trim()) params.append('search', search.trim());
      if (eventId && eventId.trim()) params.append('eventId', eventId.trim());
      const queryString = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/api/club/${slug}/registrations${queryString}`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.data || []);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to load registrations', err);
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`${slug}_admin_token`);
    localStorage.removeItem(`${slug}_admin_user`);
    navigate(`/club/${slug}/admin`);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchRegistrations(query, selectedFilterEvent);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedEventId(null);
    setEventForm({
      title: '',
      description: '',
      date: '',
      registrationDeadline: '',
      location: '',
      capacity: 50,
      ticketPrice: 0
    });
    setShowEventModal(true);
  };

  const openEditModal = (event) => {
    setModalMode('edit');
    setSelectedEventId(event._id);
    const formattedDate = new Date(event.date).toISOString().slice(0, 16);
    const formattedDeadline = event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : '';
    setEventForm({
      title: event.title,
      description: event.description || '',
      date: formattedDate,
      registrationDeadline: formattedDeadline,
      location: event.location,
      capacity: event.capacity,
      ticketPrice: event.ticketPrice
    });
    setShowEventModal(true);
  };

  const handleEventFormSubmit = async (e) => {
    e.preventDefault();
    const url = modalMode === 'create' 
      ? `/api/club/${slug}/events` 
      : `/api/club/${slug}/events/${selectedEventId}`;
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowEventModal(false);
        fetchEvents();
        fetchAnalytics();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      alert('Network error while saving event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also remove associated registration metadata.')) return;

    try {
      const res = await fetch(`/api/club/${slug}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
        fetchAnalytics();
      } else {
        alert(data.message || 'Deletion failed');
      }
    } catch (err) {
      alert('Failed to connect to backend for event deletion');
    }
  };

  const handleManualCheckIn = async (passToken) => {
    try {
      const res = await fetch(`/api/club/${slug}/scanner/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ passToken })
      });
      const data = await res.json();
      if (data.success) {
        fetchRegistrations(searchQuery);
        fetchAnalytics();
      } else {
        alert(data.message || 'Check-in validation failed');
      }
    } catch (err) {
      alert('Network error validating pass');
    }
  };

  // Toggle individual certificate issuance
  const handleToggleCertificate = async (registrationId) => {
    try {
      const res = await fetch(`/api/club/${slug}/registrations/${registrationId}/toggle-certificate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchRegistrations(searchQuery);
      } else {
        alert(data.message || 'Failed to update certificate status');
      }
    } catch (err) {
      alert('Network error updating certificate');
    }
  };

  // Bulk issue certificates to all verified attendees of an event
  const handleBulkIssueCertificates = async () => {
    const targetEventId = selectedFilterEvent || (events[0] && events[0]._id);
    if (!targetEventId) {
      alert('Please create or select an event first.');
      return;
    }

    const targetEvent = events.find(e => e._id === targetEventId);
    const eventName = targetEvent ? targetEvent.title : 'selected event';

    if (!window.confirm(`Issue & Release certificates to ALL verified checked-in attendees of "${eventName}"?`)) return;

    setIsBulkIssuing(true);
    try {
      const res = await fetch(`/api/club/${slug}/events/${targetEventId}/bulk-issue-certificates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchRegistrations(searchQuery);
      } else {
        alert(data.message || 'Failed to bulk issue certificates');
      }
    } catch (err) {
      alert('Network error during bulk certificate issuance');
    } finally {
      setIsBulkIssuing(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export attendee roster as CSV with UTF-8 BOM encoding
  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) {
      alert('No attendee registrations found to export.');
      return;
    }

    const headers = [
      'Attendee Name',
      'Email',
      'Phone',
      'Q.ID',
      'Department',
      'Year',
      'Event Title',
      'Check-in Status',
      'Check-in Time',
      'Pass ID',
      'Certificate ID',
      'Certificate Issued',
      'Registration Date'
    ];

    const rows = registrations.map(reg => [
      `"${(reg.name || '').replace(/"/g, '""')}"`,
      `"${(reg.email || '').replace(/"/g, '""')}"`,
      `"${(reg.phone || '').replace(/"/g, '""')}"`,
      `"${(reg.qid || reg.rollNumber || '').replace(/"/g, '""')}"`,
      `"${(reg.department || '').replace(/"/g, '""')}"`,
      `"${(reg.year || '').replace(/"/g, '""')}"`,
      `"${(reg.eventId?.title || 'N/A').replace(/"/g, '""')}"`,
      reg.checkedIn ? 'Checked-In' : 'Pending',
      reg.checkInTime ? `"${new Date(reg.checkInTime).toLocaleString()}"` : 'N/A',
      `"${reg.passId || ''}"`,
      `"${reg.certificateId || ''}"`,
      reg.certificateIssued ? 'Issued' : 'Not Issued',
      `"${new Date(reg.createdAt).toLocaleString()}"`
    ]);

    const csvString = [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${slug}_attendee_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchCertSettings = async () => {
    setLoadingCertSettings(true);
    try {
      const currentToken = localStorage.getItem(`${slug}_admin_token`);
      const res = await fetch(`/api/club/${slug}/certificate-settings`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCertSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch certificate settings:', err);
    } finally {
      setLoadingCertSettings(false);
    }
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, or SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCertSettings(prev => ({
        ...prev,
        certificateTemplateUrl: reader.result,
        certificateStyle: 'custom_template'
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetTemplate = () => {
    setCertSettings(prev => ({
      ...prev,
      certificateTemplateUrl: '',
      certificateStyle: 'default_dark'
    }));
  };

  const handleSaveCertSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingCertSettings(true);
    setCertSaveSuccess(false);
    try {
      const currentToken = localStorage.getItem(`${slug}_admin_token`);
      const res = await fetch(`/api/club/${slug}/certificate-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(certSettings)
      });
      const data = await res.json();
      if (data.success) {
        setCertSaveSuccess(true);
        setTimeout(() => setCertSaveSuccess(false), 3000);
      } else {
        alert(data.message || 'Failed to save certificate template settings');
      }
    } catch (err) {
      alert('Network error saving certificate template');
    } finally {
      setSavingCertSettings(false);
    }
  };

  const handleOpenClubQr = async () => {
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
      console.error('Failed to generate club QR:', err);
    }
  };

  const handleDownloadClubQr = () => {
    if (!clubQrUrl) return;
    const link = document.createElement('a');
    link.href = clubQrUrl;
    link.download = `${slug}_club_registration_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClubLink = () => {
    const fullUrl = `${window.location.origin}/club/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen pb-20 bg-grid-dots relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none neon-pulse-glow"
        style={{ backgroundColor: 'var(--primary)' }}
      ></div>

      {/* Admin Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/club/${slug}`} className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1">
              <span>← Portal</span>
            </Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></span>
              <span className="font-bold text-white font-heading text-sm">{club.name} Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Club Portal QR Code Share Button */}
            <button
              onClick={handleOpenClubQr}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-white/10 hover:border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5 transition shadow-sm"
              title="Generate Club Link QR Code for Students"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Club Portal QR</span>
            </button>

            <Link
              to={`/club/${slug}/admin/scanner`}
              className="text-xs font-bold px-3.5 py-2 rounded-xl text-slate-950 flex items-center gap-1.5 hover:opacity-90 transition shadow-lg"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <QrCode className="w-4 h-4" />
              <span>Gate Scanner</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition shadow-sm"
              title="Logout Organizer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 relative z-10">
        
        {/* Navigation Tabs Pill Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-white/10 mb-8 shadow-inner">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'analytics' 
                ? 'bg-white/10 text-white shadow-md border border-white/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" style={activeTab === 'analytics' ? { color: 'var(--primary)' } : {}} />
            <span>Analytics &amp; Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('events')}
            className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'events' 
                ? 'bg-white/10 text-white shadow-md border border-white/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" style={activeTab === 'events' ? { color: 'var(--primary)' } : {}} />
            <span>Events Manager ({events.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('registrations');
              fetchRegistrations(searchQuery, selectedFilterEvent);
            }}
            className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'registrations' 
                ? 'bg-white/10 text-white shadow-md border border-white/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" style={activeTab === 'registrations' ? { color: 'var(--primary)' } : {}} />
            <span>Guest Roster &amp; Certificates ({registrations.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('template');
              fetchCertSettings();
            }}
            className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'template' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border border-purple-400/30' 
                : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-500/20'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>🎨 Certificate Template &amp; Designer</span>
          </button>
        </div>

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in">
            {loadingStats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => <div key={n} className="h-32 glass rounded-3xl animate-pulse"></div>)}
              </div>
            ) : statsError ? (
              <div className="p-8 glass-card rounded-3xl text-center border-red-500/20">
                <p className="text-red-400 font-semibold text-xs">{statsError}</p>
                <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-200">
                  Reconnect
                </button>
              </div>
            ) : dashboardData && (
              <>
                {/* 4 KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Total Events</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black font-heading text-white">{dashboardData.summary.totalEvents}</h3>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">Published activities</span>
                    </div>
                  </div>

                  <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Registrations</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Ticket className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black font-heading text-white">{dashboardData.summary.totalRegistrations}</h3>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">Passes booked</span>
                    </div>
                  </div>

                  <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Page Views</span>
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black font-heading text-white">{dashboardData.summary.totalPageViews}</h3>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">Student visits</span>
                    </div>
                  </div>

                  <div className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Attendance Rate</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black font-heading text-emerald-400">{dashboardData.summary.attendanceRate}%</h3>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                        {dashboardData.summary.totalAttendance} verified at gate
                      </span>
                    </div>
                  </div>
                </div>

                {/* Graphical Analytics Blocks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Views vs Signups */}
                  <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl">
                    <h4 className="text-xs font-bold font-mono text-slate-300 mb-6 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      Conversion Analytics (Views vs Signups)
                    </h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboardData.conversionChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="title" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0b101f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="views" fill="var(--primary)" name="Page Views" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="registrations" fill="var(--secondary)" name="Booked Tickets" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Peak Scanner Hours */}
                  <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl">
                    <h4 className="text-xs font-mono font-bold text-slate-300 mb-6 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      Scanner Peak Arrival Times (Scans/Hour)
                    </h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.peakHoursData.filter(d => d.scans > 0 || true)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0b101f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="scans" stroke="var(--primary)" name="QR Scans" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Latest Pass Registrations Table */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl">
                  <h4 className="text-xs font-bold font-mono text-slate-300 mb-4 uppercase tracking-wider">
                    Recent Pass Bookings
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-bold uppercase font-mono text-[10px]">
                          <th className="pb-3">Attendee</th>
                          <th className="pb-3">Event Name</th>
                          <th className="pb-3">Ticket ID</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentRegistrations.map(reg => (
                          <tr key={reg._id} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-3">
                              <p className="font-bold text-slate-200">{reg.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{reg.email}</p>
                            </td>
                            <td className="py-3 text-slate-300 font-medium">{reg.eventId ? reg.eventId.title : 'Deleted Event'}</td>
                            <td className="py-3 font-mono text-slate-400">{reg.passId}</td>
                            <td className="py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                reg.checkedIn 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {reg.checkedIn ? 'CHECKED-IN' : 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: EVENTS MANAGER */}
        {activeTab === 'events' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Event Listings Manager</h2>
                <p className="text-xs text-slate-400">Create, adjust and delete club activities</p>
              </div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2.5 rounded-xl bg-primary text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition shadow-lg w-fit"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Plus className="w-4 h-4" />
                <span>Create New Event</span>
              </button>
            </div>

            {loadingEvents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(n => <div key={n} className="h-44 glass rounded-3xl animate-pulse"></div>)}
              </div>
            ) : events.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl text-center border-dashed border-white/10">
                <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-300 font-bold text-sm">No Events Published</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Click "Create New Event" to launch your first campus activity.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {events.map(event => (
                  <div key={event._id} className="glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-bold text-white text-base font-heading">{event.title}</h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(event)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                            title="Edit Event"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{event.description || 'No description provided.'}</p>
                      
                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Capacity: {event.capacity} seats ({event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice}`})</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="block font-bold text-emerald-400">{event.registrationCount} registered</span>
                        <span className="text-[10px] text-slate-500 font-mono">{event.attendanceCount} checked-in</span>
                      </div>

                      <Link
                        to={`/club/${slug}/register/${event._id}`}
                        target="_blank"
                        className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition"
                      >
                        <span>Open Form</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GUEST ROSTER & CERTIFICATES */}
        {activeTab === 'registrations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Attendee Directory & E-Certificates</h2>
                <p className="text-xs text-slate-400">Verify gate attendance, issue post-event certificates, and export guest rosters</p>
              </div>

              {/* Action, Filter and Search bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Event Selector for Bulk Actions */}
                {events.length > 0 && (
                  <select
                    value={selectedFilterEvent}
                    onChange={(e) => {
                      const newEventId = e.target.value;
                      setSelectedFilterEvent(newEventId);
                      fetchRegistrations(searchQuery, newEventId);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary shadow-inner"
                  >
                    <option value="">All Events</option>
                    {events.map(ev => (
                      <option key={ev._id} value={ev._id}>{ev.title}</option>
                    ))}
                  </select>
                )}

                {/* Bulk Issue Certificates Button */}
                <button
                  onClick={handleBulkIssueCertificates}
                  disabled={isBulkIssuing}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg shrink-0 disabled:opacity-50"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>{isBulkIssuing ? 'Issuing...' : 'Issue All Certificates'}</span>
                </button>

                {/* Direct Certificate Designer Shortcut */}
                <button
                  onClick={() => {
                    setActiveTab('template');
                    fetchCertSettings();
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shrink-0"
                  title="Upload custom background or edit signatures"
                >
                  <Palette className="w-4 h-4 text-purple-300" />
                  <span>Customize Template</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search attendee, Q.ID, pass..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner transition"
                  />
                </div>
              </div>
            </div>

            {loadingRegs ? (
              <div className="h-64 glass-card rounded-3xl animate-pulse"></div>
            ) : registrations.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl text-center border-dashed border-white/10">
                <p className="text-slate-400 text-xs">No registered attendees match your query.</p>
              </div>
            ) : (
              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-bold uppercase font-mono text-[10px]">
                        <th className="p-4">Attendee</th>
                        <th className="p-4">Q.ID & Dept</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Event Details</th>
                        <th className="p-4">Gate Status</th>
                        <th className="p-4">E-Certificate Status</th>
                        <th className="p-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map(reg => (
                        <tr key={reg._id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4">
                            <div>
                              <p className="font-bold text-slate-100">{reg.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{reg.email}</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">{reg.passId}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                                {reg.qid || reg.rollNumber || '—'}
                              </span>
                              <p className="text-[10px] text-slate-400 truncate max-w-[140px] mt-1">{reg.department || 'General'}</p>
                              {reg.year && <p className="text-[9px] text-slate-500">{reg.year}</p>}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-slate-300 text-[11px]">{reg.phone || '—'}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-200">{reg.eventId ? reg.eventId.title : 'Deleted Event'}</span>
                          </td>
                          <td className="p-4">
                            {reg.checkedIn ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Checked-In</span>
                                </div>
                                {reg.checkInTime && (
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {new Date(reg.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending Gate</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {reg.certificateIssued ? (
                              <div className="flex flex-col gap-1.5 items-start">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>Issued & Verified</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/club/${slug}/certificate/${reg.certificateId}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[10px] font-bold transition"
                                  >
                                    <Award className="w-3 h-3" />
                                    <span>View ({reg.certificateId})</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </Link>
                                  <span className="text-slate-600">|</span>
                                  <button
                                    onClick={() => handleToggleCertificate(reg._id)}
                                    className="text-[9px] text-red-400 hover:underline font-semibold"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5 items-start">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5 text-[10px] font-mono">
                                  <Clock className="w-3 h-3 text-amber-400/80" />
                                  <span>Locked (Pending)</span>
                                </span>
                                <button
                                  onClick={() => handleToggleCertificate(reg._id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition shadow-sm"
                                >
                                  <Award className="w-3 h-3 text-amber-400" />
                                  <span>Approve & Issue</span>
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {!reg.checkedIn && (
                              <button
                                onClick={() => handleManualCheckIn(reg.passToken)}
                                className="text-[10px] font-bold border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 px-3 py-1.5 rounded-xl transition whitespace-nowrap shadow-sm"
                              >
                                Manual Check-In
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CERTIFICATE TEMPLATE & DESIGNER */}
        {activeTab === 'template' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header description */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10">
              <div>
                <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-400" />
                  <span>Custom Certificate Template & Signatories</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload your club's custom certificate background design or customize official signatory names. All attendee details, QR passes & seals will automatically print on top!
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveCertSettings}
                  disabled={savingCertSettings}
                  className="px-5 py-2.5 rounded-xl text-slate-950 font-black text-xs flex items-center gap-2 hover:opacity-90 transition shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {savingCertSettings ? (
                    <span>Saving...</span>
                  ) : certSaveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950" />
                      <span>Saved Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Save & Apply Design</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main Template Designer Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form Controls (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1. Background Image Uploader */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>Certificate Background Template</span>
                    </h4>
                    {certSettings.certificateTemplateUrl && (
                      <button
                        onClick={handleResetTemplate}
                        className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Default</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload your custom blank certificate design (from Canva, Photoshop, or Illustrator).
                    Standard A4 ratio (<strong>1414 x 1000 px</strong>) in PNG, JPG, or SVG format.
                  </p>

                  {/* Upload Dropzone */}
                  <label className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-900/40 hover:bg-slate-900/80 group text-center">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/svg+xml, image/webp" 
                      onChange={handleTemplateUpload} 
                      className="hidden" 
                    />
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition">
                      {certSettings.certificateTemplateUrl ? 'Change Template Image' : 'Click to Upload Custom Template'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, SVG up to 10MB</span>
                  </label>

                  {certSettings.certificateTemplateUrl ? (
                    <div className="p-3 bg-slate-900/90 rounded-2xl border border-emerald-500/30 flex items-center gap-3">
                      <div className="w-12 h-9 rounded-lg overflow-hidden border border-white/10 bg-black flex-shrink-0">
                        <img src={certSettings.certificateTemplateUrl} alt="Template Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-emerald-400 block truncate">Custom Template Active</span>
                        <span className="text-[10px] text-slate-400 block">Dynamic content will overlay on this background</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-900/90 rounded-2xl border border-white/10 flex items-center gap-3">
                      <span className="text-lg">🏆</span>
                      <div>
                        <span className="text-xs font-bold text-amber-300 block">Luxury Dark Gold (Default Template)</span>
                        <span className="text-[10px] text-slate-400 block">Built-in vector gold filigree borders & dark canvas</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Official Signatories Setup */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Official Certificate Signatories</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Customize the names and designations that appear in the digital signature blocks.
                  </p>

                  {/* Signatory 1: Club Lead */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">Signatory 1 (Club Lead / Admin)</span>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Signatory Name</label>
                      <input
                        type="text"
                        value={certSettings.signatory1Name}
                        onChange={e => setCertSettings({...certSettings, signatory1Name: e.target.value})}
                        placeholder="e.g. Alex Mercer"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Signatory Designation / Role</label>
                      <input
                        type="text"
                        value={certSettings.signatory1Title}
                        onChange={e => setCertSettings({...certSettings, signatory1Title: e.target.value})}
                        placeholder="e.g. Club Lead / Admin"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Signatory 2: Super Admin / Dean */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                    <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">Signatory 2 (Campus Super Admin / Dean)</span>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Signatory Name</label>
                      <input
                        type="text"
                        value={certSettings.signatory2Name}
                        onChange={e => setCertSettings({...certSettings, signatory2Name: e.target.value})}
                        placeholder="e.g. Dr. V. K. Sharma"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Signatory Designation / Role</label>
                      <input
                        type="text"
                        value={certSettings.signatory2Title}
                        onChange={e => setCertSettings({...certSettings, signatory2Title: e.target.value})}
                        placeholder="e.g. Campus Super Admin / Dean"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCertSettings}
                    disabled={savingCertSettings}
                    className="w-full py-3 rounded-xl text-slate-950 font-black text-xs hover:opacity-90 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    {savingCertSettings ? 'Saving...' : 'Save All Certificate Settings'}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Interactive Preview (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Live Dynamic Overlay Preview</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">Simulated A4 Landscape View</span>
                </div>

                {/* Simulated Certificate Preview Box */}
                <div 
                  className="relative rounded-3xl border-4 border-amber-500/40 p-6 md:p-8 shadow-2xl overflow-hidden transition-all duration-300 select-none text-slate-100"
                  style={{
                    backgroundImage: certSettings.certificateTemplateUrl ? `url(${certSettings.certificateTemplateUrl})` : 'linear-gradient(135deg, #0e1628 0%, #090d1a 50%, #0a1020 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '440px'
                  }}
                >
                  {/* Subtle dark tint if custom template */}
                  {certSettings.certificateTemplateUrl && (
                    <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
                  )}

                  {/* Corner Ornaments */}
                  <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg pointer-events-none"></div>
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg pointer-events-none"></div>
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg pointer-events-none"></div>
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg pointer-events-none"></div>

                  {/* Header */}
                  <div className="text-center relative z-10 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{club.name}</span>
                    <h2 className="text-xl md:text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 font-serif">
                      Certificate of Completion
                    </h2>
                    <span className="text-[9px] text-slate-400 font-mono tracking-widest block">This credential officially certifies that</span>
                  </div>

                  {/* Recipient */}
                  <div className="text-center relative z-10 mb-4">
                    <h3 className="text-2xl font-black text-white font-serif border-b-2 border-amber-400/30 pb-1 max-w-xs mx-auto">
                      Rahul Sharma
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                      has successfully attended, participated, and completed all required milestones in <strong className="text-amber-300">"{events[0]?.title || 'Campus Event'}"</strong> organized by <strong>{club.name}</strong>.
                    </p>
                  </div>

                  {/* Footer metadata & signatures */}
                  <div className="grid grid-cols-3 gap-3 items-end pt-4 border-t border-white/10 relative z-10 mt-6">
                    {/* Sig 1 */}
                    <div className="text-center space-y-0.5">
                      <div style={{ fontFamily: "'Great Vibes', cursive" }} className="text-2xl text-amber-200 font-normal">
                        {certSettings.signatory1Name || 'Alex Mercer'}
                      </div>
                      <div className="border-t border-white/20 pt-1">
                        <span className="text-[10px] font-bold text-slate-200 block">{certSettings.signatory1Title || 'Club Lead'}</span>
                        <span className="text-[8px] text-slate-400 block">{club.name}</span>
                      </div>
                    </div>

                    {/* Seal */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 p-0.5 shadow-md flex items-center justify-center border border-amber-300">
                        <div className="w-full h-full rounded-full border border-dashed border-amber-950/70 flex flex-col items-center justify-center bg-amber-500 text-slate-950 text-[6px] font-black">
                          <span>OFFICIAL</span>
                          <span className="text-[8px] leading-tight">SEAL</span>
                        </div>
                      </div>
                      <span className="text-[8px] text-amber-400 font-mono mt-1 font-bold">CERT-SAMPLE</span>
                    </div>

                    {/* Sig 2 */}
                    <div className="text-center space-y-0.5">
                      <div style={{ fontFamily: "'Great Vibes', cursive" }} className="text-2xl text-sky-200 font-normal">
                        {certSettings.signatory2Name || 'Dr. V. K. Sharma'}
                      </div>
                      <div className="border-t border-white/20 pt-1">
                        <span className="text-[10px] font-bold text-slate-200 block">{certSettings.signatory2Title || 'Super Admin'}</span>
                        <span className="text-[8px] text-slate-400 block">Dean of Student Affairs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center italic">
                  💡 When students receive their certificates in Gmail or download online, all details will render dynamically on this template.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* CREATE / EDIT EVENT MODAL */}
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
            <div className="glass-card w-full max-w-md rounded-3xl border border-white/15 overflow-hidden shadow-2xl p-6 md:p-8 relative">
              <h3 className="text-xl font-bold font-heading text-white mb-1">
                {modalMode === 'create' ? 'Launch New Event' : 'Adjust Event Settings'}
              </h3>
              <p className="text-xs text-slate-400 mb-6">Scope registrations and seating allocations</p>

              <form onSubmit={handleEventFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Event Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. AI & Robotics Bootcamp"
                    value={eventForm.title}
                    onChange={e => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                  <textarea
                    placeholder="Event agenda and details..."
                    value={eventForm.description}
                    onChange={e => setEventForm({...eventForm, description: e.target.value})}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Event Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={eventForm.date}
                      onChange={e => setEventForm({...eventForm, date: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary shadow-inner"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Registration Deadline</span>
                      <span className="text-[10px] text-amber-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={eventForm.registrationDeadline}
                      onChange={e => setEventForm({...eventForm, registrationDeadline: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tech Auditorium"
                    value={eventForm.location}
                    onChange={e => setEventForm({...eventForm, location: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Capacity (Seats) *</label>
                    <input
                      type="number"
                      min={1}
                      value={eventForm.capacity}
                      onChange={e => setEventForm({...eventForm, capacity: parseInt(e.target.value)})}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary shadow-inner"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ticket Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={eventForm.ticketPrice}
                      onChange={e => setEventForm({...eventForm, ticketPrice: parseFloat(e.target.value) || 0})}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-5 border-t border-white/10 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2.5 border border-white/10 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-slate-950 font-black rounded-xl text-xs hover:opacity-90 transition shadow-lg"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    {modalMode === 'create' ? 'Publish Event' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* CLUB REGISTRATION LINK QR CODE MODAL FOR ADMIN */}
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
                <span>Student Registration QR</span>
              </div>

              <h3 className="font-bold text-lg font-heading text-white line-clamp-1">
                {club.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
                Students can scan this QR code with Google Lens / Camera to open this club directly and register for events!
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
                  onClick={handleCopyClubLink}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px] font-bold border border-white/10"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <button
                  onClick={handleDownloadClubQr}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Poster PNG</span>
                </button>

                <Link
                  to={`/club/${slug}`}
                  target="_blank"
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Visit Portal</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ClubAdminDashboard;
