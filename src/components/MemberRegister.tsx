import { useState } from 'react';
import { UserPlus, AlertCircle, ArrowLeft, CheckCircle, Mail, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { registerMember } from '../lib/memberAuth';
import { sendRegistrationEmailViaSupabase } from '../lib/memberNotifications';

export default function MemberRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await registerMember(
        formData.email,
        formData.password,
        formData.fullName,
        formData.companyName || undefined,
        formData.phone || undefined
      );

      const emailResult = await sendRegistrationEmailViaSupabase(
        formData.email,
        formData.fullName,
        formData.companyName || undefined,
        formData.phone || undefined
      );

      setEmailSent(emailResult.success);
      setRegistered(true);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to register. Please try again.';

      if (errorMessage.includes('already registered')) {
        setError('This email is already registered. Please sign in instead, or contact support@cubbyhealth.com if you believe this is an error.');
      } else if (errorMessage.includes('contact support')) {
        setError(errorMessage);
      } else {
        setError('Failed to register. Please try again or contact support@cubbyhealth.com for assistance.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 bg-[url('/blue-white-abstract-pattern.webp')] opacity-5 bg-cover bg-center"></div>

        <div className="relative max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Submitted!</h2>
            {emailSent ? (
              <>
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                  <Mail className="w-5 h-5" />
                  <span className="text-sm font-medium">Confirmation email sent</span>
                </div>
                <p className="text-gray-600 mb-6">
                  Thank you for registering! A confirmation email has been sent to your inbox.
                  Your account is now pending approval from our team. You will receive another email
                  once your account has been approved and you can access our preferred vendors.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Email notification pending</span>
                </div>
                <p className="text-gray-600 mb-6">
                  Thank you for registering! Your account has been created successfully and is now pending approval.
                  We are experiencing a temporary issue sending email notifications, but your registration has been
                  received. You will be notified at {formData.email} once your account has been approved.
                </p>
              </>
            )}
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
              Member Registration
            </h2>
            <p className="text-gray-600 mt-3 mb-4 text-base overflow-visible" style={{ lineHeight: '2', paddingBottom: '12px' }}>
              Register to access our preferred vendors
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  {error.includes('already registered') && (
                    <a
                      href="/member-login"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block underline"
                    >
                      Go to Sign In
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowOptional(!showOptional)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showOptional ? 'rotate-180' : ''}`} />
                <span>Additional Information (optional)</span>
              </button>

              {showOptional && (
                <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                      placeholder="Your Company"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
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
                  Processing...
                </span>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/member-login" className="text-blue-600 hover:text-cyan-600 font-semibold transition-colors text-sm">
              Already have an account? Sign in
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Your account will be reviewed and approved by our team
        </p>
      </div>
    </div>
  );
}
