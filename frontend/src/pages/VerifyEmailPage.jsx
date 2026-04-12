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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md text-center space-y-4">
        {status === 'verifying' && (
          <>
            <div className="text-4xl animate-spin inline-block">⏳</div>
            <p className="text-gray-400">Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-4xl">✅</div>
            <h2 className="text-2xl font-bold">Email verified!</h2>
            <p className="text-gray-400">Your account is now active.</p>
            <Link
              to="/login"
              className="inline-block mt-2 bg-purple-600 hover:bg-purple-700 font-semibold px-6 py-2 rounded-lg transition"
            >
              Log in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl">❌</div>
            <h2 className="text-2xl font-bold">Verification failed</h2>
            <p className="text-gray-400">{message}</p>
            <Link to="/register" className="text-purple-400 hover:underline text-sm">
              Register again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
