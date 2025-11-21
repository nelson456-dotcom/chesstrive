import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallbackPage = () => {
  const [status, setStatus] = useState('Completing secure sign-in...');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const redirect = searchParams.get('redirect') || '/lessons';

    if (error) {
      const readableError = (() => {
        try {
          return decodeURIComponent(error);
        } catch {
          return error;
        }
      })();
      setStatus(`Authentication failed: ${readableError}`);
      return;
    }

    if (!token) {
      setStatus('Missing authentication token. Please start over.');
      return;
    }

    const normalizedRedirect = redirect.startsWith('/') ? redirect : '/lessons';

    const finalizeLogin = async () => {
      try {
        localStorage.setItem('token', token);
        setStatus('Authentication successful. Loading your account...');
        await refreshUser?.();
        navigate(normalizedRedirect, { replace: true });
      } catch (refreshError) {
        console.error('OAuth callback refresh error:', refreshError);
        setStatus('Logged in, but failed to load profile. Redirecting...');
        setTimeout(() => navigate(normalizedRedirect, { replace: true }), 1500);
      }
    };

    finalizeLogin();
  }, [searchParams, refreshUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Signing you in…</h1>
        <p className="text-gray-300 max-w-md">{status}</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;

