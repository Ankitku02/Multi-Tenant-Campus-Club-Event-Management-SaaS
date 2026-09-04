import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Outlet, Link } from 'react-router-dom';
import Home from './pages/Home';
import ClubHome from './pages/ClubHome';
import EventRegister from './pages/EventRegister';
import ClubAdminLogin from './pages/ClubAdminLogin';
import ClubAdminDashboard from './pages/ClubAdminDashboard';
import ClubAdminScanner from './pages/ClubAdminScanner';
import CertificateView from './pages/CertificateView';
import CertificateVerify from './pages/CertificateVerify';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import { ShieldAlert } from 'lucide-react';

// Layout component to dynamically load and set club branding configurations
function ClubThemeWrapper() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [club, setClub] = useState(null);

  useEffect(() => {
    if (!slug) return;
    
    setLoading(true);
    fetch(`/api/tenants/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Club branding details could not be loaded');
        return res.json();
      })
      .then(data => {
        if (data.success && data.data) {
          const tenant = data.data;
          setClub(tenant);
          
          // Set dynamic theme CSS variables on root element
          document.documentElement.style.setProperty('--primary', tenant.primaryColor);
          document.documentElement.style.setProperty('--secondary', tenant.secondaryColor);
          
          // Generate translucent RGBA glows for dynamic styling
          const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result 
              ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
              : '59, 130, 246';
          };
          document.documentElement.style.setProperty('--primary-glow', `rgba(${hexToRgb(tenant.primaryColor)}, 0.25)`);
          document.documentElement.style.setProperty('--secondary-glow', `rgba(${hexToRgb(tenant.secondaryColor)}, 0.25)`);
          
          document.title = `${tenant.name} - Portal`;
        } else {
          throw new Error('Club not found');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#060912]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-primary border-slate-800 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: 'var(--primary)' }}></div>
          <p className="text-slate-400 font-medium text-xs">Resolving club namespace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060912] text-center px-4">
        <div className="p-8 glass-card rounded-3xl max-w-md w-full border border-red-500/20 shadow-2xl">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-xl font-bold font-heading text-red-400 mt-4 mb-2">Club Not Found</h2>
          <p className="text-slate-400 text-xs mb-6">The club workspace you are trying to visit does not exist or has been archived.</p>
          <Link to="/" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-xs font-bold inline-block shadow-lg">
            Return to Hub Index
          </Link>
        </div>
      </div>
    );
  }

  // Handle Suspended Club status
  if (club && club.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060912] text-center px-4">
        <div className="p-8 glass-card rounded-3xl max-w-md w-full border border-red-500/30 shadow-2xl">
          <ShieldAlert className="w-14 h-14 text-red-400 mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl font-bold font-heading text-red-400 mt-2 mb-2">Club Workspace Suspended</h2>
          <p className="text-slate-300 text-xs mb-6 leading-relaxed">
            This club workspace ({club.name}) has been temporarily suspended by Campus Administration. Please reach out to the university authorities.
          </p>
          <Link to="/" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl transition text-xs font-bold inline-block">
            Return to Platform Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global Broadcast Announcement Banner (if set by Super Admin) */}
      {club && club.broadcastMessage && (
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white text-xs font-bold px-4 py-2 text-center shadow-lg relative z-50">
          <span>{club.broadcastMessage}</span>
        </div>
      )}
      <Outlet context={{ club }} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Global landing page and tenant directory */}
        <Route path="/" element={<Home />} />

        {/* Super Admin Master Console */}
        <Route path="/super-admin" element={<SuperAdminLogin />} />
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />

        {/* Global Public Certificate Verification Portal */}
        <Route path="/verify-certificate/:certificateId" element={<CertificateVerify />} />

        {/* Club-scoped layouts */}
        <Route path="/club/:slug" element={<ClubThemeWrapper />}>
          <Route index element={<ClubHome />} />
          <Route path="register/:eventId" element={<EventRegister />} />
          <Route path="certificate/:certificateId" element={<CertificateView />} />
          <Route path="admin" element={<ClubAdminLogin />} />
          <Route path="admin/dashboard" element={<ClubAdminDashboard />} />
          <Route path="admin/scanner" element={<ClubAdminScanner />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#060912] text-center px-4">
            <div className="p-8 glass-card rounded-3xl max-w-md w-full border border-white/10 shadow-2xl">
              <span className="text-5xl">🌌</span>
              <h2 className="text-xl font-bold font-heading text-slate-200 mt-4 mb-2">Page Not Found</h2>
              <p className="text-slate-400 text-xs mb-6">The page or route you requested does not exist on this platform.</p>
              <Link to="/" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-xs font-bold inline-block shadow-lg">
                Return to Home Hub
              </Link>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
