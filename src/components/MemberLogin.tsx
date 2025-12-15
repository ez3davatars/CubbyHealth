import { useState, useEffect } from 'react';
import { LogIn, AlertCircle, ArrowLeft, Clock, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMemberProfile, createMemberSession } from '../lib/memberAuth';

export default function MemberLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const memberProfile = await getMemberProfile(session.user.id);
      if (memberProfile) {
        if (memberProfile.is_approved && memberProfile.is_active) {
          window.location.href = '/vendor-portal';
        } else if (!memberProfile.is_approved) {
          setIsPending(true);
        }
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setResendingVerification(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setSuccess('Verification email sent! Please check your inbox and spam folder.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setIsPending(false);
    setNeedsEmailVerification(false);

    if (isForgotPassword) {
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,

        });

        if (resetError) throw resetError;

        setSuccess('Password reset email sent! Please check your inbox and click the link to reset your password.');
        setEmail('');
      } catch (err: any) {
        setError(err.message || 'Failed to send reset email. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        if (!data.user.email_confirmed_at) {
          setNeedsEmailVerification(true);
          await supabase.auth.signOut();
          return;
        }

        const memberProfile = await getMemberProfile(data.user.id);

        if (!memberProfile) {
          await supabase.auth.signOut();
          setError('No member account found. Please register first.');
          return;
        }

        if (!memberProfile.is_approved) {
          setIsPending(true);
          await supabase.auth.signOut();
          return;
        }

        if (!memberProfile.is_active) {
          await supabase.auth.signOut();
          setError('Your account has been deactivated. Please contact support.');
          return;
        }

        await createMemberSession(
          memberProfile.id,
          'browser',
          navigator.userAgent
        );

        const intendedPartner = sessionStorage.getItem('intended_partner');
        if (intendedPartner) {
          sessionStorage.removeItem('intended_partner');
        }

        window.location.href = '/vendor-portal';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (needsEmailVerification) {
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
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Email Verification Required</h2>
            <p className="text-gray-600 mb-6">
              Please verify your email address before signing in. Check your inbox for a verification
              email from Cubby Health.
            </p>
            {success && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-start gap-3 shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed mb-4"
            >
              {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <a
              href="/"
              className="inline-block text-blue-600 hover:text-cyan-600 font-semibold transition-colors text-sm"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isPending) {
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
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
            <p className="text-gray-600 mb-6">
              Your member account is currently pending approval from our team. You will receive an
              email notification once your account has been approved and you can access our preferred
              vendors.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              Return to Home
            </a>
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
          <div className="text-center mb-8 overflow-visible">
            <a href="/" className="inline-block mb-6">
              <img
                src="/Cubby Health.png"
                alt="Cubby Health"
                className="h-16 mx-auto hover:scale-105 transition-transform duration-300"
              />
            </a>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent pb-1">
              {isForgotPassword ? 'Reset Password' : 'Member Sign In'}
            </h2>
            <p className="text-gray-600 mt-3 mb-4 text-base overflow-visible" style={{ lineHeight: '2', paddingBottom: '12px' }}>
              {isForgotPassword
                ? 'Enter your email to receive a password reset link'
                : 'Sign in to access our preferred vendors'}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                placeholder="you@example.com"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                  placeholder="••••••••"
                />
              </div>
            )}

            {!isForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-blue-600 hover:text-cyan-600 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
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
                  {isForgotPassword ? 'Sending...' : 'Signing In...'}
                </span>
              ) : isForgotPassword ? (
                'Send Reset Link'
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            {!isForgotPassword && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <a
                  href="/member-register"
                  className="mt-6 inline-block text-blue-600 hover:text-cyan-600 font-semibold transition-colors text-sm"
                >
                  Don't have an account? Register
                </a>
              </>
            )}

            {isForgotPassword && (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className="mt-6 text-blue-600 hover:text-cyan-600 font-semibold transition-colors text-sm"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Secure member authentication powered by Supabase
        </p>
      </div>
    </div>
  );
}
