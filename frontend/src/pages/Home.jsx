import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Plus, ExternalLink, Shield, Layers, Award, Target, 
  Cpu, Music, Radio, QrCode, Search, CheckCircle2, Ticket, 
  Zap, ArrowRight, Palette, Lock, Users, X, ChevronRight, Crown,
  Download, Share2, Copy, Check
} from 'lucide-react';
import QRCode from 'qrcode';

const LOGO_ICONS = {
  Award: Award,
  Target: Target,
  Cpu: Cpu,
  Music: Music,
  Radio: Radio
};

const COLOR_PRESETS = [
  { name: 'Cyber Blue', primary: '#3b82f6', secondary: '#10b981' },
  { name: 'Electric Violet', primary: '#8b5cf6', secondary: '#ec4899' },
  { name: 'Neon Amber', primary: '#f59e0b', secondary: '#ef4444' },
  { name: 'Emerald Wave', primary: '#10b981', secondary: '#06b6d4' }
];

function Home() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Newly created or selected Club QR Modal state
  const [qrModalClub, setQrModalClub] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');
  const [logo, setLogo] = useState('Award');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = () => {
    setLoading(true);
    fetch('/api/tenants')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClubs(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching clubs:', err);
        setLoading(false);
      });
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setSlug(generatedSlug);
  };

  const applyPreset = (preset) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  };

  const openClubQrModal = async (clubObj) => {
    setQrModalClub(clubObj);
    setCopiedLink(false);
    try {
      const fullUrl = `${window.location.origin}/club/${clubObj.slug}`;
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
      console.error('Failed to generate QR code:', err);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !qrModalClub) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${qrModalClub.slug}_portal_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (!qrModalClub) return;
    const fullUrl = `${window.location.origin}/club/${qrModalClub.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!name || !slug || !adminUsername || !adminEmail || !adminPassword) {
      setFormError('Please fill in all required fields (including Admin credentials)');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          primaryColor,
          secondaryColor,
          logo,
          adminUsername,
          adminEmail,
          adminPassword
        })
      });

      const result = await response.json();
      if (result.success) {
        const createdClub = result.data || { name, slug, primaryColor, secondaryColor, logo, description };
        setFormSuccess(true);
        setName('');
        setSlug('');
        setDescription('');
        setAdminUsername('');
        setAdminEmail('');
        setAdminPassword('');
        fetchClubs();
        setShowCreateModal(false);
        setFormSuccess(false);
        // Automatically open Club QR Modal for the newly created club!
        openClubQrModal(createdClub);
      } else {
        setFormError(result.message || 'Failed to create club tenant');
      }
    } catch (err) {
      setFormError('Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const PreviewIcon = LOGO_ICONS[logo] || Award;

  return (
    <div className="min-h-screen pb-10 px-4 md:px-8 relative overflow-hidden bg-grid-dots flex flex-col justify-between">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none neon-pulse-glow"></div>
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none neon-pulse-glow"></div>

      <div>
        {/* Compact Navbar & Header */}
        <header className="max-w-7xl mx-auto pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between border-b border-white/5 relative z-10 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center font-bold text-lg text-slate-950 shadow-md shadow-blue-500/20">
              🎫
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg md:text-xl font-black font-heading text-white tracking-tight">
                  CampusClub<span className="text-blue-400">OS</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Campus Event, Ticketing & QR Credential Hub</p>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
            <div className="relative max-w-xs w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search club or slug..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
              />
            </div>

            <Link
              to="/super-admin"
              className="px-3 py-1.5 rounded-xl border border-purple-500/30 hover:border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0"
            >
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span>Super Admin</span>
            </Link>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-blue-500/20 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Club</span>
            </button>
          </div>
        </header>

        {/* Compact Hero Strip */}
        <section className="max-w-7xl mx-auto py-5 relative z-10">
          <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
              <div>
                <h2 className="text-sm font-bold text-white font-heading">Campus Club Workspaces</h2>
                <p className="text-xs text-slate-400">Select an organization to enter their branded portal, book event passes, or manage gate check-ins.</p>
              </div>
            </div>

            {/* Quick Feature Badges */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium shrink-0 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-emerald-400" /> Gate Scanner
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" /> E-Certificates
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-400" /> Isolated Slugs
              </span>
            </div>
          </div>
        </section>

        {/* Main Active Clubs Grid */}
        <main className="max-w-7xl mx-auto py-2 relative z-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-36 glass rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl text-center border-dashed border-white/10 max-w-md mx-auto">
              <span className="text-3xl">🎪</span>
              <h4 className="text-base font-bold font-heading text-slate-200 mt-2 mb-1">
                {searchFilter ? 'No Matching Clubs' : 'No Clubs Registered'}
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                {searchFilter 
                  ? 'Try searching with a different keyword.' 
                  : 'Click the "+ New Club" button to launch the first club portal.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                + Register First Club
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClubs.map(club => {
                const IconComp = LOGO_ICONS[club.logo] || Award;
                return (
                  <div
                    key={club._id}
                    className="glass-card glass-hover p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between border border-white/5 transition-all duration-300 group"
                  >
                    {/* Glowing highlight orb */}
                    <div 
                      className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                      style={{ backgroundColor: club.primaryColor }}
                    ></div>

                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm"
                          style={{ 
                            color: club.primaryColor, 
                            borderColor: `${club.primaryColor}30`,
                            backgroundColor: `${club.primaryColor}15` 
                          }}
                        >
                          <IconComp className="w-4.5 h-4.5" />
                        </div>

                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-400">
                          /{club.slug}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-sm font-heading text-slate-100 group-hover:text-white transition line-clamp-1">
                        {club.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                        {club.description || 'Dedicated campus club workspace and event coordination portal.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full shadow-sm" 
                          style={{ backgroundColor: club.primaryColor }}
                        ></span>
                        <span 
                          className="w-2 h-2 rounded-full shadow-sm" 
                          style={{ backgroundColor: club.secondaryColor }}
                        ></span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openClubQrModal(club)}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 transition"
                          title="View & Download Club QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/club/${club.slug}/admin`}
                          className="text-[10px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition"
                        >
                          Admin
                        </Link>
                        <Link
                          to={`/club/${club.slug}`}
                          className="text-[11px] font-bold flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shadow-sm"
                        >
                          <span>Portal</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* CREATE CLUB MODAL DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-white/15 overflow-hidden shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base font-heading text-white">Create Club Workspace</h3>
                <p className="text-[11px] text-slate-400">Deploy an isolated tenant namespace</p>
              </div>
            </div>

            {/* Live Theme Preview */}
            <div className="mb-4 p-3 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center border"
                  style={{ 
                    color: primaryColor, 
                    borderColor: `${primaryColor}40`,
                    backgroundColor: `${primaryColor}15`
                  }}
                >
                  <PreviewIcon className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">{name || 'Your Club Name'}</h5>
                  <p className="text-[10px] font-mono text-slate-400">/club/{slug || 'your-slug'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: secondaryColor }}></span>
              </div>
            </div>

            {formError && (
              <div className="p-3 text-xs bg-red-950/50 border border-red-500/20 text-red-400 rounded-xl mb-3">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 text-xs bg-emerald-950/50 border border-emerald-500/20 text-emerald-300 rounded-xl mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Club workspace deployed successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Club Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Google Developer Student Club"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">URL Slug *</label>
                <div className="flex rounded-xl bg-slate-900 border border-white/10 overflow-hidden text-xs focus-within:border-blue-500">
                  <span className="px-2.5 py-2 text-slate-500 font-mono bg-white/5 border-r border-white/5 select-none">/club/</span>
                  <input
                    type="text"
                    placeholder="gdsc-chapter"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="w-full px-2.5 py-2 bg-transparent text-white font-mono placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tagline / Bio</label>
                <textarea
                  placeholder="Mission and activities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner resize-none"
                />
              </div>

              {/* Theme Palettes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Brand Colors</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] text-slate-300 flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: preset.primary }}></span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-white/10">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300">{primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-white/10">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-300">{secondaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Logo Select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Logo Emblem</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {Object.keys(LOGO_ICONS).map((key) => {
                    const Icon = LOGO_ICONS[key];
                    const isSelected = logo === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLogo(key)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                            : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold">{key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin credentials */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">Organizer Admin Login</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Admin Username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Admin Email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                    required
                  />
                </div>
                <input
                  type="password"
                  placeholder="Master Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Deploying...' : 'Launch Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLUB REGISTRATION LINK QR CODE MODAL */}
      {qrModalClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-3xl border border-white/20 overflow-hidden shadow-2xl p-6 relative text-center">
            {/* Close Button */}
            <button
              onClick={() => {
                setQrModalClub(null);
                setQrDataUrl('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <QrCode className="w-3.5 h-3.5" />
              <span>Direct Club QR Pass</span>
            </div>

            <h3 className="font-bold text-lg font-heading text-white line-clamp-1">
              {qrModalClub.name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
              Students can scan this QR code with Google Lens / Camera to open this club directly and register!
            </p>

            {/* Rendered QR Code Image Frame */}
            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mx-auto border-4 border-slate-800">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`${qrModalClub.name} QR`} 
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
                {window.location.origin}/club/{qrModalClub.slug}
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
                <span>Save PNG</span>
              </button>

              <Link
                to={`/club/${qrModalClub.slug}`}
                target="_blank"
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Link</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Compact Footer */}
      <footer className="max-w-7xl mx-auto pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 relative z-10">
        <p>© 2026 CampusClubOS SaaS • Multi-Tenant Isolated Architecture</p>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <span className="text-slate-400">Gate QR &amp; Verified E-Certificates</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
