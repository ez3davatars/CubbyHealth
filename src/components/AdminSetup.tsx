import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, AlertCircle, Lock } from 'lucide-react';

export default function AdminSetup() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');

    if (!tokenParam) {
      setError('Invalid invitation link');
      setValidating(false);
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
  }, []);

  const validateToken = async (tokenValue: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_invitation_tokens')
        .select(`
          *,
          admin_users!inner(email, full_name)
        `)
        .eq('token', tokenValue)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        setError('This invitation link is invalid or has expired');
        setTokenValid(false);
      } else {
        setTokenValid(true);
        setAdminEmail(data.admin_users.email);
      }
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Failed to validate invitation link');
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid invitation link');
      return;
    }

    setLoading(true);

    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('admin_invitation_tokens')
        .select('admin_users!inner(user_id, email)')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        setError('This invitation link is invalid or has expired');
        setLoading(false);
        return;
      }

      const userId = tokenData.admin_users.user_id;

      const { data: { session } } = await supabase.auth.getSession();

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const updateResponse = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${userId}`,
        {
          method: 'PUT',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: password,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to set password');
      }

      const { error: tokenUpdateError } = await supabase
        .from('admin_invitation_tokens')
        .update({ used: true })
        .eq('token', token);

      if (tokenUpdateError) {
        console.error('Error marking token as used:', tokenUpdateError);
      }

      const { error: adminUpdateError } = await supabase
        .from('admin_users')
        .update({
          must_change_password: false,
          password_expires_at: null,
        })
        .eq('user_id', userId);

      if (adminUpdateError) {
        console.error('Error updating admin record:', adminUpdateError);
      }

      setSuccess(true);

      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err: any) {
      console.error('Error setting up password:', err);
      setError(err.message || 'Failed to set up your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{error || 'This invitation link is invalid or has expired.'}</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-cyan-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been set successfully. You can now sign in to your admin account.
            </p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent pb-1">
              Set Your Password
            </h2>
            <p className="text-gray-600 mt-3 text-base">
              Welcome! Create a secure password for your admin account
            </p>
            {adminEmail && (
              <p className="text-sm text-gray-500 mt-2">{adminEmail}</p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
                minLength={8}
                className="w-full px-4 py-3.5 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                placeholder="Enter your password"
              />
              <p className="text-xs text-gray-500 mt-2">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3.5 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Setting up your account...
                </span>
              ) : (
                'Set Password & Continue'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Secure authentication powered by Supabase
        </p>
      </div>
    </div>
  );
}
