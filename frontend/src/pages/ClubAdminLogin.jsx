import React, { useState } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, User, Sparkles, LogIn, Award, Target, Cpu, Music, Radio, ArrowLeft, Lock } from 'lucide-react';

const LOGO_ICONS = {
  Award: Award,
  Target: Target,
  Cpu: Cpu,
  Music: Music,
  Radio: Radio
};

function ClubAdminLogin() {
  const { slug } = useParams();
  const { club } = useOutletContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/club/${slug}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem(`${slug}_admin_token`, data.token);
        localStorage.setItem(`${slug}_admin_user`, JSON.stringify(data.user));
        navigate(`/club/${slug}/admin/dashboard`);
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Connection refused. Please check if your backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const IconComp = LOGO_ICONS[club.logo] || Award;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-grid-dots relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none neon-pulse-glow"
        style={{ backgroundColor: 'var(--primary)' }}
      ></div>
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none neon-pulse-glow"
        style={{ backgroundColor: 'var(--secondary)', animationDelay: '2s' }}
      ></div>

      {/* Return link */}
      <Link 
        to={`/club/${slug}`} 
        className="mb-8 text-xs text-slate-400 font-semibold hover:text-white transition flex items-center gap-1.5 relative z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to {club.name} Portal</span>
      </Link>

      <div className="w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 p-8 md:p-10 z-10">
        {/* Dynamic primary colored background highlight */}
        <div 
          className="absolute -right-24 -top-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: 'var(--primary)' }}
        ></div>

        {/* Portal Branding */}
        <div className="text-center mb-8 relative z-10">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-xl transition transform hover:scale-105"
            style={{ 
              color: 'var(--primary)',
              borderColor: 'var(--primary-glow)',
              backgroundColor: 'rgba(255,255,255,0.05)' 
            }}
          >
            <IconComp className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black font-heading text-white tracking-tight uppercase">{club.name}</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono font-semibold">Organizer Control Hub</p>
        </div>

        {error && (
          <div className="p-3.5 text-xs bg-red-950/50 border border-red-500/20 text-red-400 rounded-xl mb-6 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="e.g. admin@campusclub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-inner transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3.5 rounded-2xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-xl"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> 
                <span>Sign In To Dashboard</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ClubAdminLogin;
