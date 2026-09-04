import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { 
  Award, ShieldCheck, Printer, Share2, ArrowLeft, CheckCircle2, 
  Clock, AlertCircle, Copy, ExternalLink, Sparkles 
} from 'lucide-react';

function CertificateView() {
  const { slug, certificateId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCertificate();
  }, [slug, certificateId]);

  const fetchCertificate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/club/${slug}/certificate/${certificateId}`);
      const data = await res.json();
      if (data.success) {
        setCert(data.data);
        
        // Generate QR code pointing to public global verification portal
        const verifyUrl = `${window.location.origin}/verify-certificate/${data.data.certificateId}`;
        const qr = await QRCode.toDataURL(verifyUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(qr);
      } else {
        setError(data.message || 'Certificate not found');
      }
    } catch (err) {
      setError('Failed to retrieve certificate details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const verifyUrl = `${window.location.origin}/verify-certificate/${certificateId}`;
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080c16]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-amber-400 border-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium text-sm">Rendering verified credential...</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    const isLocked = error.toLowerCase().includes('attendance') || error.toLowerCase().includes('issued') || error.toLowerCase().includes('unlocked');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c16] text-center px-4">
        <div className={`p-8 glass rounded-3xl max-w-md w-full border ${isLocked ? 'border-amber-500/30' : 'border-red-500/20'} shadow-2xl`}>
          <div className={`w-14 h-14 rounded-2xl ${isLocked ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'} flex items-center justify-center mx-auto mb-4`}>
            {isLocked ? <Award className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
          </div>
          <h2 className={`text-xl font-bold font-heading mb-2 ${isLocked ? 'text-amber-300' : 'text-red-400'}`}>
            {isLocked ? 'Certificate Locked' : 'Certificate Unavailable'}
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed mb-6">
            {error || 'This credential is not yet available or has not been released by the club organizers.'}
          </p>
          {isLocked && (
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 text-left mb-6 space-y-2 text-[11px] text-slate-400 font-mono">
              <p className="text-amber-400 font-bold">Verification Steps:</p>
              <p>1. Attend the event and get your QR pass scanned at the gate.</p>
              <p>2. Event organizer approves attendee certificates after completion.</p>
            </div>
          )}
          <Link to={`/club/${slug}`} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition text-xs font-semibold shadow-lg inline-block">
            Return to Club Home
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = cert.club?.primaryColor || '#3b82f6';
  const secondaryColor = cert.club?.secondaryColor || '#10b981';

  const [orientation, setOrientation] = useState('landscape'); // 'landscape' | 'portrait'

  const handleDownloadSvg = () => {
    if (!cert) return;
    const svgEl = document.querySelector('#printable-certificate svg');
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${cert.certificateId}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 pb-20 select-none">
      {/* Top Action Bar (Hidden during Print) */}
      <header className="print:hidden glass sticky top-0 z-50 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between flex-wrap gap-2">
          <Link to={`/club/${slug}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {cert.club.name}</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {/* A4 Orientation Toggle */}
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                  orientation === 'landscape'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="A4 Landscape Format"
              >
                A4 Landscape
              </button>
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                  orientation === 'portrait'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="A4 Portrait Format"
              >
                A4 Portrait
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 ({orientation === 'landscape' ? 'Landscape' : 'Portrait'})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Verification Notice Banner */}
      <div className={`print:hidden mx-auto px-4 mt-6 ${orientation === 'landscape' ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            {cert.checkedIn ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Attendance
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold text-[11px]">
                <Clock className="w-3.5 h-3.5" /> Entry Confirmed
              </span>
            )}
            <span className="text-slate-400 font-mono text-[11px]">ID: {cert.certificateId}</span>
          </div>

          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Issued on {new Date(cert.issuedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Certificate Frame Container - Scaled for A4 (Landscape / Portrait) */}
      <main className={`mx-auto px-4 mt-6 transition-all duration-300 ${orientation === 'landscape' ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div 
          id="printable-certificate"
          className={`relative text-slate-100 rounded-3xl border-4 border-amber-500/40 shadow-2xl overflow-hidden print:m-0 print:border-4 print:border-black print:text-black ${
            orientation === 'landscape' ? 'p-8 md:p-12' : 'p-8 md:p-14'
          } ${cert.club?.certificateTemplateUrl ? 'bg-black' : 'bg-gradient-to-br from-[#0e1628] via-[#090d1a] to-[#0a1020]'}`}
          style={{
            backgroundImage: cert.club?.certificateTemplateUrl ? `url(${cert.club.certificateTemplateUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 40px rgba(245, 158, 11, 0.05)'
          }}
        >
          {/* If custom template, add a subtle dark contrast overlay so text is readable */}
          {cert.club?.certificateTemplateUrl && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] pointer-events-none"></div>
          )}

          {/* Subtle Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-amber-400/60 rounded-tl-xl pointer-events-none"></div>
          <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-amber-400/60 rounded-tr-xl pointer-events-none"></div>
          <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-amber-400/60 rounded-bl-xl pointer-events-none"></div>
          <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-amber-400/60 rounded-br-xl pointer-events-none"></div>

          {/* Background watermark seal */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Award className="w-96 h-96 text-amber-400" />
          </div>

          {/* Certificate Header */}
          <div className="text-center relative z-10">
            {/* Club Brand Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-white/10 text-xs font-semibold mb-4 print:bg-slate-100 print:text-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span style={{ color: primaryColor }}>{cert.club.name}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 font-serif print:text-slate-900">
              Certificate of Completion
            </h1>

            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mt-2 font-medium print:text-slate-600">
              Official Campus Credential &amp; Recognition
            </p>
          </div>

          {/* Certificate Body */}
          <div className={`text-center relative z-10 ${orientation === 'landscape' ? 'my-8 md:my-10' : 'my-10 md:my-14'}`}>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">This credential officially certifies that</p>
            
            <h2 className="text-2xl md:text-4xl font-bold text-white mt-4 mb-2 font-serif border-b-2 border-amber-400/30 pb-3 max-w-xl mx-auto print:text-black">
              {cert.attendeeName}
            </h2>

            {(cert.qid || cert.rollNumber || cert.department) && (
              <div className="flex items-center justify-center gap-3 text-xs text-amber-300/90 font-medium mb-4 print:text-slate-700 flex-wrap">
                {(cert.qid || cert.rollNumber) && <span className="font-mono bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">Q.ID: {cert.qid || cert.rollNumber}</span>}
                {cert.department && <span>Department of {cert.department}</span>}
                {cert.year && <span>• {cert.year}</span>}
              </div>
            )}

            <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mt-4 font-light print:text-slate-800">
              has successfully attended, participated, and completed all required milestones in <strong className="font-semibold text-white print:text-black">"{cert.event.title}"</strong>, 
              conducted under the auspices of <strong className="text-white print:text-black">{cert.club.name}</strong> on <strong className="text-white print:text-black">{new Date(cert.event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong> at {cert.event.location}.
            </p>
          </div>

          {/* Certificate Footer: Dual Signatures + Central Gold Seal + Authenticity QR */}
          <div className={`pt-8 border-t border-white/10 relative z-10 mt-8 print:border-slate-300 items-end ${
            orientation === 'landscape' 
              ? 'grid grid-cols-1 md:grid-cols-4 gap-6' 
              : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'
          }`}>
            {/* 1. Left: Club Admin / Lead Signatory */}
            <div className="text-center md:text-left space-y-1">
              <div className="relative inline-block min-w-[150px]">
                {/* Visual Handwritten Ink Stroke */}
                <svg className="w-36 h-10 text-amber-300 mx-auto md:mx-0 print:text-black" viewBox="0 0 160 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 10 25 C 25 5, 40 38, 55 12 C 70 -8, 85 30, 105 10 C 120 -10, 135 22, 155 8 M 15 32 L 150 28" />
                </svg>
                <div style={{ fontFamily: "'Great Vibes', cursive" }} className="text-3xl text-amber-200 font-normal -mt-7 mb-1 print:text-black select-text">
                  {cert.club?.signatory1Name || 'Alex Mercer'}
                </div>
                <div className="border-b-2 border-amber-400/40 w-full"></div>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-1 print:text-black">{cert.club?.signatory1Title || 'Club Lead / Admin'}</p>
              <p className="text-[10px] text-slate-400">{cert.club.name} Directorate</p>
            </div>

            {/* 2. Center-Left: Official Gold Authenticity Seal Badge */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 p-0.5 shadow-xl flex items-center justify-center border-2 border-amber-300">
                <div className="w-full h-full rounded-full border-2 border-dashed border-amber-950/70 flex flex-col items-center justify-center bg-gradient-to-b from-amber-400 to-yellow-500 text-slate-950 shadow-inner">
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none">★ OFFICIAL ★</span>
                  <span className="text-[12px] font-black uppercase tracking-wider leading-tight">SEAL</span>
                  <span className="text-[7px] font-extrabold tracking-tighter leading-none">AUTHENTIC</span>
                </div>
              </div>
              <span className="text-[10px] text-amber-300 font-mono font-bold mt-1.5">Verified Credential</span>
            </div>

            {/* 3. Center-Right: Verification QR */}
            <div className="flex flex-col items-center justify-center text-center">
              {qrCodeUrl && (
                <div className="p-1.5 bg-white rounded-xl shadow-lg border-2 border-amber-400">
                  <img src={qrCodeUrl} alt="Verify QR" className="w-16 h-16" />
                </div>
              )}
              <span className="text-[9px] text-slate-400 font-mono mt-1 uppercase tracking-wider block print:text-slate-600">
                Scan to Verify
              </span>
              <span className="text-[9px] text-amber-400 font-mono font-bold">{cert.certificateId}</span>
            </div>

            {/* 4. Right: Campus Super Admin / Dean Signatory */}
            <div className="text-center md:text-right space-y-1">
              <div className="relative inline-block min-w-[150px]">
                {/* Visual Handwritten Ink Stroke */}
                <svg className="w-36 h-10 text-sky-300 mx-auto md:ml-auto md:mr-0 print:text-black" viewBox="0 0 160 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 10 20 C 30 -5, 45 35, 70 8 C 95 -15, 110 28, 135 5 C 150 -10, 155 18, 158 12 M 15 28 L 152 28" />
                </svg>
                <div style={{ fontFamily: "'Great Vibes', cursive" }} className="text-3xl text-sky-200 font-normal -mt-7 mb-1 print:text-black select-text">
                  {cert.club?.signatory2Name || 'Dr. V. K. Sharma'}
                </div>
                <div className="border-b-2 border-sky-400/40 w-full"></div>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-1 print:text-black">{cert.club?.signatory2Title || 'Campus Super Admin'}</p>
              <p className="text-[10px] text-slate-400">Dean of Student Affairs</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CertificateView;
