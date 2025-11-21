import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import ChessUpgradeLogo from './ChessUpgradeLogo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const result = await login(username, password);
      if (result.success) {
        navigate('/lessons');
      } else {
        setError(result.error || 'Failed to log in');
      }
    } catch (err) {
      setError('Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20"></div>
      <div className="relative max-w-md w-full">
        {/* Login Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-blue-900/80 backdrop-blur-xl border border-blue-500/30 rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <ChessUpgradeLogo size="default" variant="full" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-300">Sign in to continue your chess journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm">
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-300">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-10 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Social Login */}
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={async () => {
                  setError('');
                  const token = window.prompt('Enter Google ID token (for testing)');
                  if (!token) return;
                  setLoading(true);
                  const result = await loginWithGoogle(token);
                  setLoading(false);
                  if (result.success) {
                    navigate('/lessons');
                  } else {
                    setError(result.error || 'Google login failed');
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-white/90 hover:bg-white text-slate-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span>Continue with Google</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  setError('');
                  const token = window.prompt('Enter Facebook access token (for testing)');
                  if (!token) return;
                  setLoading(true);
                  const result = await loginWithFacebook(token);
                  setLoading(false);
                  if (result.success) {
                    navigate('/lessons');
                  } else {
                    setError(result.error || 'Facebook login failed');
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span>Continue with Facebook</span>
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 
