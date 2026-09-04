import React, { useEffect, useState, useRef } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Camera, 
  RefreshCw, Volume2, ShieldCheck, Ticket, User, Mail, Sparkles, Upload, Image 
} from 'lucide-react';

function ClubAdminScanner() {
  const { slug } = useParams();
  const { club } = useOutletContext();
  const navigate = useNavigate();

  const [token] = useState(localStorage.getItem(`${slug}_admin_token`));
  const scannerRef = useRef(null);

  // Scanner status states
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState('');
  
  // Feedback results states: 'idle', 'validating', 'success', 'error'
  const [scanStatus, setScanStatus] = useState('idle');
  const [scanResult, setScanResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fallback direct copy-paste state
  const [manualTokenInput, setManualTokenInput] = useState('');

  useEffect(() => {
    if (!token) {
      navigate(`/club/${slug}/admin`);
      return;
    }

    discoverCameras();

    return () => {
      stopScannerInstance();
    };
  }, [slug, token]);

  const discoverCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      
      // Stop any lingering media tracks that getCameras() probe might have left open
      const videos = document.querySelectorAll('video');
      videos.forEach(v => {
        if (v.srcObject && v.srcObject.getTracks) {
          v.srcObject.getTracks().forEach(t => t.stop());
          v.srcObject = null;
        }
      });

      if (devices && devices.length > 0) {
        setCameraDevices(devices);
        const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        const selectedCam = backCam || devices[0];
        setActiveCameraId(selectedCam.id);
        setHasCameraPermission(true);
      } else {
        setHasCameraPermission(false);
      }
    } catch (err) {
      console.error('Camera discovery error:', err);
      setHasCameraPermission(false);
    }
  };

  const requestCameraAccess = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      await discoverCameras();
    } catch (err) {
      console.error('Camera request error:', err);
      alert('Camera permission is blocked. Please click the site settings icon (padlock/camera icon) next to the URL in your browser address bar and set Camera to "Allow", then refresh the page.');
    }
  };

  const startScannerInstance = async (cameraId) => {
    if (!cameraId) return;
    
    await stopScannerInstance();
    setScanStatus('idle');
    setScanResult(null);
    setErrorMessage('');
    
    try {
      const html5Qrcode = new Html5Qrcode("scanner-viewport");
      scannerRef.current = html5Qrcode;
      setIsScanning(true);

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdgePercentage = 0.75;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: Math.max(200, qrboxSize),
            height: Math.max(200, qrboxSize)
          };
        },
        aspectRatio: 1.0,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await html5Qrcode.start(
        cameraId,
        config,
        (decodedText) => {
          handleQrRead(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error("Scanner failed to start", err);
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    await stopScannerInstance();
    setScanStatus('validating');

    try {
      const html5Qrcode = new Html5Qrcode("scanner-viewport");
      const decodedText = await html5Qrcode.scanFile(file, true);
      handleQrRead(decodedText);
    } catch (err) {
      console.error('File scan error:', err);
      setScanStatus('error');
      setErrorMessage('Could not find a valid QR Code in the uploaded image.');
    }
  };

  const stopScannerInstance = async () => {
    try {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch (e) {}
        try {
          await scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }

      // Explicitly stop all video tracks and clear video DOM elements
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => {
              track.stop();
              track.enabled = false;
            });
          }
          video.srcObject = null;
        }
        video.pause();
        video.removeAttribute('src');
        video.load();
      });

      const container = document.getElementById('scanner-viewport');
      if (container) {
        container.innerHTML = '';
      }
    } catch (err) {
      console.error("Error completely shutting down camera:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const triggerAudioChime = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
        
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (err) {}
  };

  const handleQrRead = async (scannedPayload) => {
    await stopScannerInstance();
    setScanStatus('validating');

    try {
      const response = await fetch(`/api/club/${slug}/scanner/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ passToken: scannedPayload })
      });
      const data = await response.json();

      if (data.success) {
        triggerAudioChime('success');
        setScanResult(data.data);
        setScanStatus('success');
      } else {
        triggerAudioChime('error');
        setErrorMessage(data.message || 'Ticket verification failed');
        setScanStatus('error');
      }
    } catch (err) {
      triggerAudioChime('error');
      setErrorMessage('Server connection offline. Check local server.');
      setScanStatus('error');
    }
  };

  const handleCameraChange = (e) => {
    const selectedId = e.target.value;
    setActiveCameraId(selectedId);
    if (isScanning) {
      startScannerInstance(selectedId);
    }
  };

  const resumeScanning = () => {
    setScanStatus('idle');
    setScanResult(null);
    setErrorMessage('');
    startScannerInstance(activeCameraId);
  };

  return (
    <div className="min-h-screen bg-[#060912] flex flex-col justify-between relative overflow-hidden bg-grid-dots">
      {/* Scanner header */}
      <header className="glass p-4 border-b border-white/5 flex items-center justify-between text-slate-300 relative z-10">
        <Link to={`/club/${slug}/admin/dashboard`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> 
          <span>Exit Scanner</span>
        </Link>
        <div className="text-center">
          <h2 className="text-sm font-black tracking-wide uppercase text-white font-heading">{club.name}</h2>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-Time Gate Scanner
          </span>
        </div>
        <div className="w-16"></div>
      </header>

      {/* Main scanner center viewport */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full relative z-10">
        {scanStatus === 'idle' && (
          <div className="w-full space-y-6">
            {/* Camera Viewport Frame */}
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl flex flex-col items-center justify-center">
              
              {/* HTML5 Qrcode Viewport */}
              <div id="scanner-viewport" className="absolute inset-0 w-full h-full object-cover"></div>

              {/* Scanning visual crosshair guide overlays */}
              {!isScanning && (
                <div className="z-10 text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto shadow-lg">
                    <Camera className="w-8 h-8" />
                  </div>
                  {hasCameraPermission === false ? (
                    <div>
                      <p className="text-sm font-bold text-red-400">Camera Access Blocked</p>
                      <p className="text-xs text-slate-400 max-w-xs mt-1 mb-3.5 mx-auto">Please allow camera permissions in your browser or click below to retry.</p>
                      <button
                        onClick={requestCameraAccess}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg inline-flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Request Camera Permission</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold font-heading text-white">Camera Scanner Ready</p>
                      <p className="text-xs text-slate-400 mt-1">Select an active lens and initialize feed</p>
                    </div>
                  )}
                </div>
              )}

              {isScanning && (
                <>
                  <div className="absolute inset-10 border-2 border-dashed border-blue-400 rounded-3xl pointer-events-none opacity-60 animate-pulse"></div>
                  <div 
                    className="absolute left-10 right-10 h-0.5 bg-blue-400 pointer-events-none shadow-[0_0_15px_rgba(59,130,246,1)] animate-bounce"
                    style={{ top: '50%' }}
                  ></div>
                </>
              )}
            </div>

            {/* Lens selection controls */}
            {cameraDevices.length > 1 && (
              <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs shadow-inner">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={activeCameraId} 
                  onChange={handleCameraChange}
                  className="bg-transparent border-none text-slate-200 focus:outline-none w-full cursor-pointer font-medium"
                >
                  {cameraDevices.map(device => (
                    <option key={device.id} value={device.id} className="bg-slate-950 text-slate-200">
                      {device.label || `Camera Source ${device.id.substring(0, 4)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons: Camera Launch & Image Upload */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              {hasCameraPermission && (
                <button
                  onClick={() => isScanning ? stopScannerInstance() : startScannerInstance(activeCameraId)}
                  className="flex-1 py-3.5 rounded-2xl text-slate-950 font-black text-xs tracking-wider uppercase transition shadow-xl flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <Camera className="w-4 h-4" />
                  <span>{isScanning ? 'Close Camera Lens' : 'Launch Scanning Camera'}</span>
                </button>
              )}

              <label className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-center">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload QR Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Fallback Manual Verification input box */}
            <div className="glass-card p-5 rounded-2xl border border-white/10 mt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-mono">Manual Gate Check-In (Pass ID / Email / Q.ID)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. PASS-XXXX, student@gmail.com, or Q.ID..."
                  value={manualTokenInput}
                  onChange={e => setManualTokenInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-primary shadow-inner"
                />
                <button
                  onClick={() => {
                    if (manualTokenInput.trim()) {
                      handleQrRead(manualTokenInput.trim());
                      setManualTokenInput('');
                    }
                  }}
                  className="px-4 py-2 bg-white/10 border border-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition uppercase shadow-sm"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation pending */}
        {scanStatus === 'validating' && (
          <div className="glass-card p-12 rounded-3xl text-center w-full max-w-sm border border-white/10 shadow-2xl">
            <div className="w-12 h-12 border-4 border-t-primary border-slate-800 rounded-full animate-spin mx-auto mb-6" style={{ borderTopColor: 'var(--primary)' }}></div>
            <h3 className="font-bold text-white text-base font-heading">Validating Pass Signature...</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Verifying attendee status in DB</p>
          </div>
        )}

        {/* SUCCESS INTERFACE VIEW */}
        {scanStatus === 'success' && scanResult && (
          <div className="w-full max-w-sm rounded-3xl overflow-hidden glass-card border-2 border-emerald-500/30 shadow-[0_0_50px_-5px_rgba(16,185,129,0.25)] animate-fade-in text-center p-6 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mt-2 shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                ACCESS GRANTED
              </span>
              <h3 className="text-xl font-black text-white mt-4 font-heading tracking-tight uppercase line-clamp-1">{scanResult.name}</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">{scanResult.email}</p>
            </div>

            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket ID:</span>
                <span className="text-slate-200 font-bold">{scanResult.passId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gate Time:</span>
                <span className="text-emerald-400 font-bold">{new Date(scanResult.checkInTime).toLocaleTimeString()}</span>
              </div>
            </div>

            <button
              onClick={resumeScanning}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg"
            >
              Scan Next Attendee
            </button>
          </div>
        )}

        {/* REJECTION / ERROR INTERFACE VIEW */}
        {scanStatus === 'error' && (
          <div className="w-full max-w-sm rounded-3xl overflow-hidden glass-card border-2 border-red-500/30 shadow-[0_0_50px_-5px_rgba(239,68,68,0.25)] animate-fade-in text-center p-6 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mt-2 shadow-lg">
              <XCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-400 uppercase tracking-widest border border-red-500/20">
                ACCESS DENIED
              </span>
              <h3 className="text-lg font-bold font-heading text-red-400 mt-4 leading-tight">{errorMessage}</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 font-mono">Verify ticket club origin</p>
            </div>

            <button
              onClick={resumeScanning}
              className="w-full py-3.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg"
            >
              Resume Scanner
            </button>
          </div>
        )}
      </main>
      
      {/* Footer copyright */}
      <footer className="py-4 text-center text-[10px] text-slate-500 font-mono relative z-10">
        CAMPUS SAAS SCANNERS v1.0.4 • ENCRYPTED GATEWAY
      </footer>
    </div>
  );
}

export default ClubAdminScanner;
