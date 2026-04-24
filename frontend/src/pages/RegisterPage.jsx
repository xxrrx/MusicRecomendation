import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

/* ── Waveform bars ───────────────────────────────────────────────────────── */
const BARS = [28, 55, 40, 72, 50, 65, 35, 85, 58, 75, 45, 80, 42, 63, 54, 70, 82, 44, 58, 48];

/* ── Keyframes (same as login for consistency) ───────────────────────────── */
const CSS = `
  @keyframes wave {
    0%   { transform: scaleY(1); }
    100% { transform: scaleY(0.2); }
  }
  @keyframes orbFloat1 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(40px,-60px) scale(1.15); }
  }
  @keyframes orbFloat2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(-50px,40px) scale(1.2); }
  }
  @keyframes orbFloat3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(30px,30px) scale(0.85); }
  }
  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes noteFloat {
    0%,100% { transform:translateY(0) rotate(-5deg); opacity:.2; }
    50%     { transform:translateY(-18px) rotate(8deg); opacity:.4; }
  }
  @keyframes successPop {
    0%   { transform:scale(0.7); opacity:0; }
    70%  { transform:scale(1.08); }
    100% { transform:scale(1); opacity:1; }
  }
  @keyframes strengthFill {
    from { width: 0; }
  }
`;

/* ── Icons ───────────────────────────────────────────────────────────────── */
const IcUser = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd"/>
  </svg>
);

const IcEmail = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/>
    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/>
  </svg>
);

const IcLock = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd"/>
  </svg>
);

const IcEyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd"/>
  </svg>
);

const IcEyeClosed = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z"/>
    <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z"/>
    <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z"/>
  </svg>
);

const IcGoogle = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const IcFacebook = () => (
  <svg viewBox="0 0 24 24" fill="#1877F2" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

/* ── Input with icon ─────────────────────────────────────────────────────── */
function AuthInput({ icon, rightSlot, ...props }) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">{icon}</div>
      <input
        {...props}
        className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-white/20
                   border border-white/10 bg-white/[0.05] outline-none
                   transition-all duration-200
                   focus:border-green-500/50 focus:bg-white/[0.08]
                   focus:shadow-[0_0_0_3px_rgba(29,185,84,0.12)]"
      />
      {rightSlot && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>}
    </div>
  );
}

/* ── Password strength ───────────────────────────────────────────────────── */
function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

/* ── Logo ────────────────────────────────────────────────────────────────── */
function LogoIcon({ size = 5 }) {
  return (
    <svg viewBox="0 0 24 24" fill="white" className={`w-${size} h-${size}`}>
      <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [form,     setForm]     = useState({ email: '', password: '', displayName: '', role: 'user' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,       setDone]       = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [resending,  setResending]  = useState(false);
  const [resendMsg,  setResendMsg]  = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await api.post('/auth/resend-verification', { email: form.email });
      setResendMsg('Email resent! Check your inbox.');
    } catch (err) {
      setResendMsg(err.response?.data?.error?.message || 'Failed to resend.');
    } finally {
      setResending(false);
    }
  };

  const strength = getStrength(form.password);

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
           style={{ background: '#07070f' }}>
        <style>{CSS}</style>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[130px] -top-40 -left-40"
               style={{ background: 'rgba(109,40,217,0.28)', animation: 'orbFloat1 9s ease-in-out infinite' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full blur-[110px] -bottom-20 -right-20"
               style={{ background: 'rgba(37,99,235,0.22)', animation: 'orbFloat2 11s ease-in-out infinite' }} />
        </div>

        <div className="relative z-10 w-full max-w-sm text-center px-8 py-12 rounded-2xl border border-white/[0.07]"
             style={{ backdropFilter: 'blur(28px)', background: 'rgba(11,11,20,0.90)', animation: 'fadeSlideUp .4s ease both' }}>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, rgba(29,185,84,0.2), rgba(29,185,84,0.05))', border: '1px solid rgba(29,185,84,0.3)', animation: 'successPop .5s cubic-bezier(.34,1.56,.64,1) both' }}>
              <svg viewBox="0 0 24 24" fill="#1DB954" className="w-10 h-10">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
          <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            We sent a verification link to
          </p>
          <p className="text-white font-semibold text-sm mb-8 px-4 py-2 rounded-xl"
             style={{ background: 'rgba(29,185,84,0.1)', border: '1px solid rgba(29,185,84,0.2)' }}>
            {form.email}
          </p>
          <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Didn't receive it? Check your spam folder or resend below.
          </p>
          <button onClick={handleResend} disabled={resending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mb-4 transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: 'rgba(29,185,84,0.15)', border: '1px solid rgba(29,185,84,0.3)' }}>
            {resending ? 'Sending…' : 'Resend verification email'}
          </button>
          {resendMsg && (
            <p className="text-xs mb-4" style={{ color: resendMsg.includes('resent') ? '#1DB954' : '#f87171' }}>
              {resendMsg}
            </p>
          )}
          <Link to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-green-400 transition-colors duration-150">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0z" clipRule="evenodd"/>
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  /* ── Register form ── */
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10"
         style={{ background: '#07070f' }}>
      <style>{CSS}</style>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[520px] h-[520px] rounded-full blur-[130px] -top-40 -left-40"
             style={{ background: 'rgba(109,40,217,0.28)', animation: 'orbFloat1 9s ease-in-out infinite' }} />
        <div className="absolute w-[420px] h-[420px] rounded-full blur-[110px] -bottom-20 -right-20"
             style={{ background: 'rgba(37,99,235,0.22)', animation: 'orbFloat2 11s ease-in-out infinite' }} />
        <div className="absolute w-[280px] h-[280px] rounded-full blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
             style={{ background: 'rgba(5,150,105,0.18)', animation: 'orbFloat3 13s ease-in-out infinite' }} />
        <div className="absolute inset-0 opacity-[0.025]"
             style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[880px] flex rounded-2xl overflow-hidden border border-white/[0.07] shadow-[0_30px_80px_rgba(0,0,0,0.65)]"
           style={{ backdropFilter: 'blur(28px)', background: 'rgba(11,11,20,0.90)', animation: 'fadeSlideUp .4s ease both' }}>

        {/* ════ Left branding ════ */}
        <div className="hidden lg:flex w-[42%] shrink-0 flex-col justify-between p-10 relative overflow-hidden border-r border-white/[0.06]"
             style={{ background: 'linear-gradient(145deg, rgba(109,40,217,0.30) 0%, rgba(37,99,235,0.20) 55%, rgba(5,150,105,0.12) 100%)' }}>

          <div className="absolute inset-0 opacity-[0.035]"
               style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />

          {/* Floating notes */}
          {[
            { top: '12%', right: '10%', char: '♬', delay: '0s',   dur: '4.5s' },
            { top: '30%', right: '5%',  char: '♪', delay: '1s',   dur: '5.5s' },
            { top: '58%', left: '7%',   char: '♩', delay: '1.8s', dur: '6s'   },
            { top: '75%', right: '12%', char: '♫', delay: '.5s',  dur: '4.8s' },
          ].map((n, i) => (
            <span key={i} className="absolute text-white/20 text-2xl select-none pointer-events-none"
                  style={{ top: n.top, right: n.right, left: n.left, animation: `noteFloat ${n.dur} ease-in-out infinite`, animationDelay: n.delay }}>
              {n.char}
            </span>
          ))}

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#1DB954,#15803d)', boxShadow: '0 4px 20px rgba(29,185,84,0.35)' }}>
              <LogoIcon size={5} />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">SoundWave</p>
              <p className="text-white/25 text-[10px] tracking-widest uppercase mt-0.5">Music for everyone</p>
            </div>
          </div>

          {/* Center content */}
          <div className="relative z-10 space-y-5">
            <div className="flex items-end gap-[3px] h-20">
              {BARS.map((h, i) => (
                <div key={i} className="flex-1 min-w-[4px] rounded-full origin-bottom"
                     style={{
                       height: `${h}%`,
                       background: 'linear-gradient(to top, #1DB954 0%, #818cf8 100%)',
                       animation: `wave ${0.65 + (i % 6) * 0.1}s ease-in-out infinite alternate`,
                       animationDelay: `${i * 0.055}s`,
                     }} />
              ))}
            </div>

            <div>
              <h2 className="text-white text-2xl font-bold leading-snug mb-2">
                Join millions<br />of listeners.
              </h2>
              <p className="text-white/35 text-sm leading-relaxed">
                Start your free account today<br />and never miss a beat.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { icon: '✓', text: 'Free forever, no credit card' },
                { icon: '✓', text: 'AI-curated playlists just for you' },
                { icon: '✓', text: 'Support your favourite artists' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: 'rgba(29,185,84,0.2)', color: '#1DB954' }}>
                    {item.icon}
                  </span>
                  <span className="text-white/45 text-xs">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs italic" style={{ color: 'rgba(255,255,255,0.18)' }}>
            "Without music, life would be a mistake" — Nietzsche
          </p>
        </div>

        {/* ════ Right form ════ */}
        <div className="flex-1 px-8 py-10 lg:px-12 overflow-y-auto">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#1DB954,#15803d)' }}>
              <LogoIcon size={4} />
            </div>
            <span className="text-white font-bold">SoundWave</span>
          </div>

          <div className="mb-7">
            <h1 className="text-[1.75rem] font-bold text-white mb-1 leading-tight">Create account</h1>
            <p className="text-white/35 text-sm">Start your music journey for free</p>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[{ icon: <IcGoogle />, label: 'Google' }, { icon: <IcFacebook />, label: 'Facebook' }].map(({ icon, label }) => (
              <button key={label} type="button"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white/65 border border-white/[0.08] transition-all duration-200 hover:bg-white/[0.08] hover:text-white hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-white/[0.07]" />
            <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.22)' }}>
              or sign up with email
            </span>
            <div className="flex-1 border-t border-white/[0.07]" />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 border text-sm px-4 py-3 rounded-xl mb-5"
                 style={{ background: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.25)', color: '#f87171', animation: 'fadeSlideUp .25s ease both' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 1.998-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.502-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">

            {/* Display name */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Display name
              </label>
              <AuthInput name="displayName" type="text" value={form.displayName} onChange={handleChange}
                required maxLength={100} placeholder="Your name" icon={<IcUser />} autoComplete="off" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Email address
              </label>
              <AuthInput name="email" type="email" value={form.email} onChange={handleChange}
                required placeholder="you@example.com" icon={<IcEmail />} autoComplete="off" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Password
              </label>
              <AuthInput name="password" type={showPass ? 'text' : 'password'} value={form.password}
                onChange={handleChange} required minLength={8} placeholder="Min. 8 characters" icon={<IcLock />} autoComplete="new-password"
                rightSlot={
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    className="transition-colors duration-150" style={{ color: 'rgba(255,255,255,0.28)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}>
                    {showPass ? <IcEyeOpen /> : <IcEyeClosed />}
                  </button>
                }
              />
              {/* Strength meter */}
              {form.password && (
                <div className="mt-2 space-y-1" style={{ animation: 'fadeSlideUp .2s ease both' }}>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div key={lvl} className="h-1 flex-1 rounded-full transition-all duration-300 overflow-hidden"
                           style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                             style={{
                               width: strength >= lvl ? '100%' : '0%',
                               background: STRENGTH_COLORS[strength] || 'transparent',
                             }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: STRENGTH_COLORS[strength] }}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                I am a…
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'user',   label: '🎧 Listener',  desc: 'Discover music' },
                  { value: 'artist', label: '🎤 Artist',    desc: 'Share your music' },
                ].map(({ value, label, desc }) => (
                  <button key={value} type="button"
                    onClick={() => setForm((f) => ({ ...f, role: value }))}
                    className="text-left p-3.5 rounded-xl border transition-all duration-200"
                    style={{
                      background: form.role === value ? 'rgba(29,185,84,0.12)' : 'rgba(255,255,255,0.04)',
                      borderColor: form.role === value ? 'rgba(29,185,84,0.45)' : 'rgba(255,255,255,0.10)',
                    }}>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
              By creating an account, you agree to our{' '}
              <span className="text-white/60 hover:text-white cursor-pointer transition-colors">Terms of Service</span>{' '}
              and{' '}
              <span className="text-white/60 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white mt-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #1DB954 0%, #0ea5e9 100%)', boxShadow: '0 4px 24px rgba(29,185,84,0.28)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold hover:text-green-400 transition-colors duration-150">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
