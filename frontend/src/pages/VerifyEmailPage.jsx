import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    api
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sp-black px-4">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <Link to="/" className="flex items-center gap-2 mb-10">
        <svg viewBox="0 0 24 24" fill="#1DB954" className="w-10 h-10">
          <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" />
        </svg>
        <span className="text-white font-extrabold text-2xl tracking-tight">SoundWave</span>
      </Link>

      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[400px] bg-[#121212] rounded-card-lg px-8 py-10 shadow-modal text-center animate-fadeIn space-y-4">

        {status === 'verifying' && (
          <>
            <div className="flex justify-center mb-2">
              <svg className="w-12 h-12 animate-spin text-sp-green" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <p className="text-sp-gray text-sm">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-sp-green/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="#1DB954" className="w-8 h-8">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Email verified!</h2>
            <p className="text-sp-gray text-sm">Your account is now active.</p>
            <Link to="/login" className="inline-block mt-2 btn-primary px-8 py-3 text-base">
              Log in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-red-950/40 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-red-400">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Verification failed</h2>
            <p className="text-sp-gray text-sm">{message}</p>
            <Link
              to="/register"
              className="inline-block mt-2 text-white font-semibold underline underline-offset-2
                         hover:text-sp-green transition-colors duration-150 text-sm"
            >
              Register again
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
