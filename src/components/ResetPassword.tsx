import { useState, useEffect } from 'react';
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');

    if (errorCode) {
      if (errorCode === 'otp_expired') {
        setError('This password reset link has expired. Please request a new one from the login page.');
      } else {
        setError(errorDescription || 'An error occurred. Please request a new password reset link.');
      }
      return;
    }

    if (accessToken && type === 'recovery') {
      setHasToken(true);
    } else {
      setError('Invalid or missing password reset token. Please request a new password reset link from the login page.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess('Password updated successfully! Redirecting to login...');

      setTimeout(() => {
        window.location.href = '/member-login';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[url('/blue-white-abstract-pattern.webp')] opacity-5 bg-cover bg-center"></div>

      <a
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </a>

      <div className="relative max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
          <div className="text-center mb-8">
            <a href="/" className="inline-block mb-6">
              <img
                src="/Cubby Health.png"
                alt="Cubby Health"
                className="h-16 mx-auto hover:scale-105 transition-transform duration-300"
              />
            </a>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="text-gray-600 mt-3 mb-4 text-base leading-loose pb-2">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-start gap-3 shadow-sm">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {hasToken ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Password must be at least 6 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !hasToken}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Updating Password...
                  </span>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Update Password
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <a
                href="/member-login"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                Go to Login
              </a>
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/member-login"
              className="text-blue-600 hover:text-cyan-600 font-semibold transition-colors text-sm"
            >
              Back to sign in
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Secure password reset powered by Supabase
        </p>
      </div>
    </div>
  );
}
