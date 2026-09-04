import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, Lock, Sparkles, LogIn, ArrowLeft, Crown } from 'lucide-react';

function SuperAdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@campus.edu');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('super_admin_token', data.token);
        localStorage.setItem('super_admin_user', JSON.stringify(data.user));
        navigate('/super-admin/dashboard');
      } else {
        setError(data.message || 'Invalid Super Admin credentials');
      }
    } catch (err) {
      setError('Connection refused. Please ensure backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofillDemo = () => {
    setEmail('admin@campus.edu');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-grid-dots relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none neon-pulse-glow" style={{ backgroundColor: '#8b5cf6' }}></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none neon-pulse-glow" style={{ backgroundColor: '#3b82f6', animationDelay: '2s' }}></div>

      {/* Return link */}
      <Link 
        to="/" 
        className="mb-6 text-xs text-slate-400 font-semibold hover:text-white transition flex items-center gap-1.5 relative z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Platform Hub</span>
      </Link>

      <div className="w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl relative border border-white/15 p-8 md:p-10 z-10">
        {/* Top glow */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

        {/* Portal Branding */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Crown className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black font-heading text-white tracking-tight">Super Admin Console</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono font-semibold">Master Campus Governance</p>
        </div>

        {error && (
          <div className="p-3.5 text-xs bg-red-950/50 border border-red-500/20 text-red-400 rounded-xl mb-6 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Master Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="admin@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Master Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 shadow-inner transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-xl"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Verifying Master Credentials...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> 
                <span>Authenticate as Super Admin</span>
              </>
            )}
          </button>

          {/* Quick Demo Autofill helper */}
          <div className="pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={handleAutofillDemo}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold transition"
            >
              Autofill Default Credentials (admin@campus.edu)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SuperAdminLogin;
