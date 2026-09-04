import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, CheckCircle2, AlertCircle, Award, Calendar, 
  MapPin, User, Building, ExternalLink, ArrowRight, Sparkles 
} from 'lucide-react';

function CertificateVerify() {
  const { certificateId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!certificateId) return;
    fetchVerificationDetails();
  }, [certificateId]);

  const fetchVerificationDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/certificates/verify/${certificateId}`);
      const result = await res.json();
      if (result.success && result.verified) {
        setData(result.data);
      } else {
        setError(result.message || 'Invalid certificate or ID not recognized.');
      }
    } catch (err) {
      setError('Unable to verify credential due to connection error.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080c16]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-emerald-400 border-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium text-sm">Verifying cryptographic credential...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col justify-between pb-12">
      {/* Top Simple Bar */}
      <nav className="glass border-b border-white/5 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition font-semibold">
            <span>← Campus Hub</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-300">Public Credential Verification</span>
          </div>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 mt-8 w-full">
        {data ? (
          <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden animate-fade-in">
            {/* Top Glow bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

            {/* Verification Header */}
            <div className="text-center pb-6 border-b border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3.5 shadow-lg">
                <ShieldCheck className="w-9 h-9" />
              </div>
              
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block mb-2">
                Authentic & Verified Credential
              </span>
              
              <h2 className="text-xl font-bold text-white tracking-tight">Verified Campus Certificate</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">Certificate ID: {data.certificateId}</p>
            </div>

            {/* Verified Details Grid */}
            <div className="py-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Awarded To</span>
                    <h3 className="text-sm font-bold text-slate-100">{data.attendeeName}</h3>
                  </div>
                  {(data.qid || data.rollNumber) && (data.qid !== 'N/A' || data.rollNumber !== 'N/A') && (
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[11px] font-mono text-slate-300 border border-white/10">
                      Q.ID: {data.qid && data.qid !== 'N/A' ? data.qid : data.rollNumber}
                    </span>
                  )}
                </div>

                {(data.department !== 'N/A' || data.year !== 'N/A') && (
                  <div className="text-[11px] text-slate-400">
                    {data.department !== 'N/A' && <span>Dept: {data.department}</span>}
                    {data.year !== 'N/A' && <span> • {data.year}</span>}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2.5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Event</span>
                  <h4 className="font-semibold text-slate-200 text-xs">{data.eventTitle}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-slate-400 text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Organizer</span>
                    <p className="text-slate-200 font-medium">{data.clubName}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Issue Date</span>
                    <p className="text-slate-200 font-medium">{new Date(data.issuedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Status */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] text-emerald-300 font-medium">
                    {data.checkedIn ? 'Attendance Confirmed at Venue Gate' : 'Registered & Credential Released'}
                  </span>
                </div>
                {data.checkInTime && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(data.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {data.clubSlug && (
                <Link
                  to={`/club/${data.clubSlug}/certificate/${data.certificateId}`}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg"
                >
                  <Award className="w-3.5 h-3.5" /> View Printable Certificate
                </Link>
              )}
              <Link
                to="/"
                className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center justify-center transition"
              >
                Campus Hub
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl p-8 border border-red-500/20 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Verification Failed</h2>
            <p className="text-xs text-slate-400 mb-6">{error || 'This certificate could not be verified. It may be invalid, revoked, or non-existent.'}</p>
            <Link to="/" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition text-xs font-semibold inline-block">
              Return to Platform Home
            </Link>
          </div>
        )}
      </main>

      <footer className="text-center text-[11px] text-slate-600 mt-8">
        Campus Club Management SaaS Credential Verification Authority
      </footer>
    </div>
  );
}

export default CertificateVerify;
