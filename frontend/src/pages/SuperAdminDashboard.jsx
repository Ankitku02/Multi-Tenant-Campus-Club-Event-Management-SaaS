import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Crown, Layers, Users, Calendar, Ticket, Award, DollarSign, 
  CheckCircle2, Search, LogOut, ShieldAlert, Key, Trash2, 
  ExternalLink, Sparkles, Send, Megaphone, CheckCircle, Clock, 
  Activity, ArrowRight, ShieldCheck, Building, Lock, RefreshCw, X,
  QrCode, Download, Copy, Check
} from 'lucide-react';
import QRCode from 'qrcode';

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('super_admin_token'));
  const [user, setUser] = useState(null);

  // Tabs: 'analytics', 'tenants', 'certificates', 'broadcast'
  const [activeTab, setActiveTab] = useState('analytics');

  // Club QR Modal state
  const [qrModalTenant, setQrModalTenant] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Stats & data
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  // Tenants list
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');

  // Certificates list
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [certSearch, setCertSearch] = useState('');

  // Password Reset Modal
  const [resetModalTenant, setResetModalTenant] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState({ error: '', success: '' });

  // Broadcast Message State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/super-admin');
      return;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem('super_admin_user'));
      setUser(storedUser);
    } catch (e) {}

    fetchDashboard();
    fetchTenants();
    fetchCertificates();
  }, [token]);

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    setDashboardError('');
    try {
      const res = await fetch('/api/super-admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setDashboardError(data.message || 'Failed to load master analytics');
        if (res.status === 401 || res.status === 403) handleLogout();
      }
    } catch (err) {
      setDashboardError('Failed to connect to Super Admin backend server');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const res = await fetch('/api/super-admin/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      }
    } catch (err) {
      console.error('Failed to load tenants', err);
    } finally {
      setLoadingTenants(false);
    }
  };

  const fetchCertificates = async (search = '') => {
    setLoadingCertificates(true);
    try {
      const queryParam = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/super-admin/certificates${queryParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (err) {
      console.error('Failed to load certificates', err);
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('super_admin_user');
    navigate('/super-admin');
  };

  const handleToggleStatus = async (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchTenants();
        fetchDashboard();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleDeleteTenant = async (tenantId, tenantName) => {
    if (!window.confirm(`Are you sure you want to completely PURGE '${tenantName}' and all its events, passes and registrations? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchTenants();
        fetchDashboard();
      } else {
        alert(data.message || 'Deletion failed');
      }
    } catch (err) {
      alert('Network error deleting club');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetStatus({ error: '', success: '' });

    if (!newPassword || newPassword.length < 6) {
      setResetStatus({ error: 'Password must be at least 6 characters', success: '' });
      return;
    }

    try {
      const res = await fetch(`/api/super-admin/tenants/${resetModalTenant._id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setResetStatus({ error: '', success: data.message });
        setTimeout(() => {
          setResetModalTenant(null);
          setNewPassword('');
          setResetStatus({ error: '', success: '' });
        }, 1500);
      } else {
        setResetStatus({ error: data.message || 'Failed to reset password', success: '' });
      }
    } catch (err) {
      setResetStatus({ error: 'Network error', success: '' });
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcastStatus('publishing');

    try {
      const res = await fetch('/api/super-admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: broadcastMessage })
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastStatus('success');
        setTimeout(() => setBroadcastStatus(''), 3000);
      } else {
        alert(data.message || 'Failed to publish broadcast');
        setBroadcastStatus('');
      }
    } catch (err) {
      alert('Network error');
      setBroadcastStatus('');
    }
  };

  const openClubQrModal = async (tenant) => {
    setQrModalTenant(tenant);
    setCopiedLink(false);
    try {
      const fullUrl = `${window.location.origin}/club/${tenant.slug}`;
      const urlData = await QRCode.toDataURL(fullUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrDataUrl(urlData);
    } catch (err) {
      console.error('Failed to generate club QR:', err);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !qrModalTenant) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${qrModalTenant.slug}_club_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (!qrModalTenant) return;
    const fullUrl = `${window.location.origin}/club/${qrModalTenant.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.slug.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    (t.adminUser?.email && t.adminUser.email.toLowerCase().includes(tenantSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen pb-20 bg-grid-dots relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none neon-pulse-glow" style={{ backgroundColor: '#8b5cf6' }}></div>

      {/* Super Admin Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1">
              <span>← Platform Hub</span>
            </Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
              <span className="font-bold text-white font-heading text-sm">Super Admin Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 glass px-3 py-1.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span>Root Access Active</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition shadow-sm"
              title="Logout Super Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 relative z-10">
        
        {/* Navigation Tab Switcher */}
        <div className="flex p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 max-w-fit mb-8 shadow-inner flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'analytics' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Master Overview & KPIs</span>
          </button>
          
          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-2 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'tenants' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Club Governance ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`py-2 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'certificates' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Master Certificate Registry</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`py-2 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              activeTab === 'broadcast' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Campus Broadcast</span>
          </button>
        </div>

        {/* TAB 1: MASTER ANALYTICS & OVERVIEW */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in">
            {loadingDashboard ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="h-28 glass rounded-2xl animate-pulse"></div>)}
              </div>
            ) : dashboardError ? (
              <div className="p-8 glass-card rounded-3xl text-center border-red-500/20">
                <p className="text-red-400 font-semibold text-xs">{dashboardError}</p>
                <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-200">
                  Retry
                </button>
              </div>
            ) : dashboardData && (
              <>
                {/* 6 Master KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  <div className="glass-card p-4 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Total Clubs</span>
                    <h3 className="text-2xl font-black font-heading text-white mt-1">{dashboardData.summary.totalTenants}</h3>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Active workspaces</span>
                  </div>

                  <div className="glass-card p-4 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Total Events</span>
                    <h3 className="text-2xl font-black font-heading text-white mt-1">{dashboardData.summary.totalEvents}</h3>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Published activities</span>
                  </div>

                  <div className="glass-card p-4 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Registrations</span>
                    <h3 className="text-2xl font-black font-heading text-white mt-1">{dashboardData.summary.totalRegistrations}</h3>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Passes generated</span>
                  </div>

                  <div className="glass-card p-4 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Gate Check-Ins</span>
                    <h3 className="text-2xl font-black font-heading text-emerald-400 mt-1">{dashboardData.summary.totalAttendance}</h3>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Scanned at doors</span>
                  </div>

                  <div className="glass-card p-4 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Total Revenue</span>
                    <h3 className="text-2xl font-black font-heading text-amber-400 mt-1">₹{dashboardData.summary.totalRevenue}</h3>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Razorpay payments</span>
                  </div>

                  <div className="glass-card p-4 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Turnout Rate</span>
                    <h3 className="text-2xl font-black font-heading text-purple-400 mt-1">{dashboardData.summary.attendanceRate}%</h3>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Campus attendance</span>
                  </div>
                </div>

                {/* Club Leaderboard & Department Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Leaderboard (7 cols) */}
                  <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-white/10 shadow-xl">
                    <h4 className="text-xs font-bold font-mono text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      Cross-Club Activity Leaderboard
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 font-bold uppercase font-mono text-[10px]">
                            <th className="pb-3">Rank & Club</th>
                            <th className="pb-3 text-center">Events</th>
                            <th className="pb-3 text-center">Bookings</th>
                            <th className="pb-3 text-center">Scans</th>
                            <th className="pb-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.clubPerformance.map((club, idx) => (
                            <tr key={club.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-3 flex items-center gap-2.5">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-slate-400'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="font-bold text-white">{club.name}</p>
                                  <span className="text-[10px] font-mono text-slate-500">/{club.slug}</span>
                                </div>
                              </td>
                              <td className="py-3 text-center font-mono text-slate-300">{club.eventCount}</td>
                              <td className="py-3 text-center font-mono font-bold text-blue-400">{club.regCount}</td>
                              <td className="py-3 text-center font-mono font-bold text-emerald-400">{club.checkInCount}</td>
                              <td className="py-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  club.status === 'ACTIVE' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {club.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Department Distribution (5 cols) */}
                  <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-white/10 shadow-xl">
                    <h4 className="text-xs font-bold font-mono text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-400" />
                      Academic Department Participation
                    </h4>

                    {dashboardData.departmentDistribution.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-10">No department registration data recorded yet.</p>
                    ) : (
                      <div className="space-y-3 pt-2">
                        {dashboardData.departmentDistribution.map((dept, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-300 truncate max-w-[200px]">{dept.department}</span>
                            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20">
                              {dept.count} students
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: CLUB GOVERNANCE */}
        {activeTab === 'tenants' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Campus Organization Directory</h2>
                <p className="text-xs text-slate-400">Activate, suspend, or reset credentials for any campus club workspace</p>
              </div>

              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search club, slug, or admin..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
                />
              </div>
            </div>

            {loadingTenants ? (
              <div className="h-64 glass-card rounded-3xl animate-pulse"></div>
            ) : filteredTenants.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl text-center border-dashed border-white/10">
                <p className="text-slate-400 text-xs">No clubs found matching your search parameters.</p>
              </div>
            ) : (
              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-bold uppercase font-mono text-[10px]">
                        <th className="p-4">Club Organization</th>
                        <th className="p-4">Organizer Admin</th>
                        <th className="p-4 text-center">Events</th>
                        <th className="p-4 text-center">Registrations</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Governance Controls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map(tenant => (
                        <tr key={tenant._id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4">
                            <div>
                              <p className="font-bold text-white text-sm">{tenant.name}</p>
                              <span className="text-[10px] font-mono text-slate-400">/club/{tenant.slug}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-semibold text-slate-300">{tenant.adminUser?.username || 'Admin'}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{tenant.adminUser?.email || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-slate-300">{tenant.eventCount}</td>
                          <td className="p-4 text-center font-mono font-bold text-blue-400">{tenant.regCount}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              tenant.status === 'ACTIVE' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {tenant.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Status Toggle */}
                              <button
                                onClick={() => handleToggleStatus(tenant._id, tenant.status || 'ACTIVE')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                  tenant.status === 'ACTIVE'
                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                                }`}
                              >
                                {tenant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  setResetModalTenant(tenant);
                                  setNewPassword('');
                                  setResetStatus({ error: '', success: '' });
                                }}
                                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition"
                                title="Reset Organizer Password"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Club Link QR Code */}
                              <button
                                onClick={() => openClubQrModal(tenant)}
                                className="p-1.5 rounded-lg border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 transition"
                                title="View & Download Club QR Code"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>

                              {/* Portal Link */}
                              <Link
                                to={`/club/${tenant.slug}`}
                                target="_blank"
                                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition"
                                title="View Club Portal"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              {/* Delete Tenant */}
                              <button
                                onClick={() => handleDeleteTenant(tenant._id, tenant.name)}
                                className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 text-red-400 transition"
                                title="Purge Club Workspace"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* TAB 3: MASTER CERTIFICATE REGISTRY */}
        {activeTab === 'certificates' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Campus E-Certificate Registry</h2>
                <p className="text-xs text-slate-400">Search and verify all participation credentials issued by campus clubs</p>
              </div>

              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by Student Name, Q.ID, Cert ID..."
                  value={certSearch}
                  onChange={(e) => {
                    setCertSearch(e.target.value);
                    fetchCertificates(e.target.value);
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
                />
              </div>
            </div>

            {loadingCertificates ? (
              <div className="h-64 glass-card rounded-3xl animate-pulse"></div>
            ) : certificates.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl text-center border-dashed border-white/10">
                <Award className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-300 font-bold text-sm">No Issued Certificates Found</p>
                <p className="text-xs text-slate-500 mt-1">Certificates are issued automatically when attendees are registered and check in.</p>
              </div>
            ) : (
              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-bold uppercase font-mono text-[10px]">
                        <th className="p-4">Certificate ID</th>
                        <th className="p-4">Recipient</th>
                        <th className="p-4">Q.ID & Dept</th>
                        <th className="p-4">Event Title</th>
                        <th className="p-4">Host Club</th>
                        <th className="p-4 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map(cert => (
                        <tr key={cert._id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4">
                            <span className="font-mono text-amber-400 font-bold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {cert.certificateId}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-white">{cert.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{cert.email}</p>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-slate-300">{cert.qid || cert.rollNumber || '—'}</span>
                            {cert.department && <p className="text-[10px] text-slate-400">{cert.department}</p>}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-200">{cert.eventId?.title || 'Campus Activity'}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs text-slate-300 font-medium">{cert.tenantId?.name || 'Club'}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/verify-certificate/${cert.certificateId}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold transition"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verify</span>
                              </Link>
                              {cert.tenantId?.slug && (
                                <Link
                                  to={`/club/${cert.tenantId.slug}/certificate/${cert.certificateId}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 text-[10px] font-semibold transition"
                                >
                                  <Award className="w-3 h-3" />
                                  <span>View</span>
                                </Link>
                              )}
                            </div>
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

        {/* TAB 4: CAMPUS BROADCAST ANNOUNCEMENTS */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-heading text-white">Campus-Wide Broadcast Notice</h3>
                  <p className="text-xs text-slate-400">Publish or clear global alerts shown across all club portals</p>
                </div>
              </div>

              {broadcastStatus === 'success' && (
                <div className="p-3.5 text-xs bg-emerald-950/50 border border-emerald-500/20 text-emerald-300 rounded-xl mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Broadcast updated across all campus club portals!</span>
                </div>
              )}

              <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Announcement Message</label>
                  <textarea
                    placeholder="e.g. 📢 Important: Campus Auditorium will undergo maintenance from March 10-12. Please reschedule indoor events."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner resize-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Leave blank and submit to clear all active broadcast notices.</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastMessage('')}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:bg-white/5 transition"
                  >
                    Clear Text
                  </button>
                  <button
                    type="submit"
                    disabled={broadcastStatus === 'publishing'}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Broadcast</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PASSWORD RESET MODAL */}
        {resetModalTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
            <div className="glass-card w-full max-w-sm rounded-3xl border border-white/15 overflow-hidden shadow-2xl p-6 relative">
              <button
                onClick={() => setResetModalTenant(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Reset Club Password</h4>
                  <p className="text-[10px] font-mono text-slate-400">{resetModalTenant.name}</p>
                </div>
              </div>

              {resetStatus.error && (
                <div className="p-3 text-xs bg-red-950/50 border border-red-500/20 text-red-400 rounded-xl mb-3">
                  {resetStatus.error}
                </div>
              )}

              {resetStatus.success && (
                <div className="p-3 text-xs bg-emerald-950/50 border border-emerald-500/20 text-emerald-300 rounded-xl mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{resetStatus.success}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">New Organizer Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 shadow-inner"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg"
                >
                  Save New Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CLUB REGISTRATION LINK QR CODE MODAL FOR SUPER ADMIN */}
        {qrModalTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="glass-card w-full max-w-sm rounded-3xl border border-white/20 overflow-hidden shadow-2xl p-6 relative text-center">
              {/* Close Button */}
              <button
                onClick={() => {
                  setQrModalTenant(null);
                  setQrDataUrl('');
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3">
                <QrCode className="w-3.5 h-3.5" />
                <span>Campus Club Link QR</span>
              </div>

              <h3 className="font-bold text-lg font-heading text-white line-clamp-1">
                {qrModalTenant.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
                Students can scan this QR code with Google Lens / Camera to open this club directly and register for events!
              </p>

              {/* Rendered QR Code Image Frame */}
              <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mx-auto border-4 border-slate-800">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt={`${qrModalTenant.name} QR`} 
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
                  {window.location.origin}/club/{qrModalTenant.slug}
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
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Poster PNG</span>
                </button>

                <Link
                  to={`/club/${qrModalTenant.slug}`}
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

export default SuperAdminDashboard;
