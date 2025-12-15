import { useState, useEffect, useMemo } from 'react';
import { Shield, CheckCircle, XCircle, Mail, Calendar, Trash2, UserPlus, Search, X, Copy, CheckCheck, AlertTriangle, Send, ExternalLink, Link2, Clock, RefreshCw } from 'lucide-react';
import { getAllAdmins, createAdmin, deleteAdmin, toggleAdminActive, AdminUser, getAdminInvitationLink, AdminInvitationDetails, regenerateAdminInvitation } from '../lib/adminAuth';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AddAdminModal({ isOpen, onClose, onSuccess }: AddAdminModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    setup_link?: string;
    email_sent?: boolean;
    email_error?: string;
    token_expires_at?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await createAdmin({
        email: formData.email,
        full_name: formData.full_name,
      });

      setResult({
        setup_link: response.setup_link,
        email_sent: response.email_sent,
        email_error: response.email_error,
        token_expires_at: response.token_expires_at,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (result?.setup_link) {
      await navigator.clipboard.writeText(result.setup_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResendEmail = async () => {
    if (!result?.setup_link || !result?.token_expires_at) return;

    setResendingEmail(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in to resend invitations');
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-admin-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            full_name: formData.full_name,
            setup_link: result.setup_link,
            token_expires_at: result.token_expires_at,
          }),
        }
      );

      if (response.ok) {
        setResult({
          ...result,
          email_sent: true,
          email_error: undefined,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to resend invitation email');
      }
    } catch (err: any) {
      console.error('Error resending email:', err);
      setError(err.message || 'Failed to resend invitation email');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: '', full_name: '' });
    setError('');
    setResult(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Admin</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-4">
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold">Admin created successfully!</span>
              </div>

              {result.email_sent ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                        Invitation Email Sent
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        An invitation email with login credentials has been sent to {formData.email}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Email Not Sent
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {result.email_error || 'Failed to send invitation email. You can resend it below.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResendEmail}
                    disabled={resendingEmail}
                    className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {resendingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Resending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Resend Invitation Email
                      </>
                    )}
                  </button>
                </div>
              )}

              {result.setup_link && (
                <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                    Password Setup Link
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={result.setup_link}
                      readOnly
                      className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono text-gray-900 dark:text-gray-100"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/40 rounded transition-colors"
                      title="Copy link"
                    >
                      {copied ? <CheckCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <a
                      href={result.setup_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/40 rounded transition-colors"
                      title="Open link"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {result.email_sent
                      ? 'This link has also been sent via email.'
                      : 'Share this link with the new admin to set up their password.'
                    }
                  </p>
                  {result.token_expires_at && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      Link expires: {new Date(result.token_expires_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

interface ViewSetupLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminUser | null;
}

function ViewSetupLinkModal({ isOpen, onClose, admin }: ViewSetupLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invitationDetails, setInvitationDetails] = useState<AdminInvitationDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);

  useEffect(() => {
    if (isOpen && admin) {
      loadInvitationDetails();
    }
  }, [isOpen, admin]);

  const loadInvitationDetails = async () => {
    if (!admin) return;

    setLoading(true);
    setError('');
    try {
      const details = await getAdminInvitationLink(admin.id);
      setInvitationDetails(details);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (invitationDetails?.setup_link) {
      await navigator.clipboard.writeText(invitationDetails.setup_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateLink = async (sendEmail: boolean) => {
    if (!admin) return;

    setRegenerating(true);
    setError('');
    setShowRegenerateOptions(false);
    try {
      const result = await regenerateAdminInvitation(admin.id, sendEmail);
      setInvitationDetails({
        has_token: true,
        token: result.token,
        setup_link: result.setup_link,
        expires_at: result.expires_at,
        admin_email: admin.email,
        admin_name: admin.full_name,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate invitation link');
    } finally {
      setRegenerating(false);
    }
  };

  const handleClose = () => {
    setInvitationDetails(null);
    setError('');
    setCopied(false);
    setShowRegenerateOptions(false);
    onClose();
  };

  if (!isOpen) return null;

  const isExpiringSoon = invitationDetails?.expires_at &&
    new Date(invitationDetails.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Setup Link</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Loading invitation details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error</p>
                    <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : invitationDetails?.has_token ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Admin: {admin?.full_name}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {invitationDetails.admin_email}
                    </p>
                  </div>
                </div>
              </div>

              {isExpiringSoon && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Expiring Soon
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        This link will expire within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Password Setup Link
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={invitationDetails.setup_link}
                    readOnly
                    className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono text-gray-900 dark:text-gray-100"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/40 rounded transition-colors"
                    title="Copy link"
                  >
                    {copied ? <CheckCheck className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <a
                    href={invitationDetails.setup_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/40 rounded transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {invitationDetails.created_at && (
                    <p>Created: {new Date(invitationDetails.created_at).toLocaleString()}</p>
                  )}
                  {invitationDetails.expires_at && (
                    <p className={isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                      Expires: {new Date(invitationDetails.expires_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Share this link with the admin to complete their account setup. The link is single-use and will expire after the date shown above.
                </p>
              </div>

              {showRegenerateOptions ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Regenerate Setup Link
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                      This will invalidate the current link and create a new one. Choose whether to send the new link via email.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRegenerateLink(false)}
                        disabled={regenerating}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Just Generate
                      </button>
                      <button
                        onClick={() => handleRegenerateLink(true)}
                        disabled={regenerating}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Mail className="w-4 h-4" />
                        Generate & Email
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRegenerateOptions(false)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRegenerateOptions(true)}
                    disabled={regenerating}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Regenerate Link
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg text-center py-8">
                <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  No Active Setup Link
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {invitationDetails?.message || 'This admin does not have a pending invitation link.'}
                </p>
              </div>

              {showRegenerateOptions ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Generate New Setup Link
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      Create a new invitation link for this admin. Choose whether to send it via email.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRegenerateLink(false)}
                        disabled={regenerating}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Just Generate
                      </button>
                      <button
                        onClick={() => handleRegenerateLink(true)}
                        disabled={regenerating}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Mail className="w-4 h-4" />
                        Generate & Email
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRegenerateOptions(false)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRegenerateOptions(true)}
                    disabled={regenerating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Generate New Link
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUserManagement() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSetupLinkModal, setShowSetupLinkModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setLoading(true);
    const data = await getAllAdmins();
    setAdmins(data);
    setLoading(false);
  }

  const handleToggleActive = async (adminId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} this admin?`)) return;

    try {
      await toggleAdminActive(adminId, !currentStatus);
      await loadAdmins();
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('Failed to update admin status');
    }
  };

  const handleViewSetupLink = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setShowSetupLinkModal(true);
  };

  const handleDeleteAdmin = async (adminUserId: string, fullName: string) => {
    if (adminUserId === user?.id) {
      alert('You cannot delete your own admin account from here. Use the Settings tab to delete your account.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${fullName}'s admin account?\n\nThis action cannot be undone.`)) return;

    const confirmText = prompt(`Type "DELETE" to confirm deletion of ${fullName}:`);
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled. You must type DELETE to confirm.');
      return;
    }

    const admin = admins.find(a => a.user_id === adminUserId);
    if (!admin) return;

    setDeletingAdminId(admin.id);

    try {
      await deleteAdmin(adminUserId);
      await loadAdmins();
      alert(`${fullName}'s admin account has been deleted.`);
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      alert(`Error: ${error?.message || 'Failed to delete admin'}`);
    } finally {
      setDeletingAdminId(null);
    }
  };

  const filteredAdmins = useMemo(() => {
    let result = admins;

    if (filter === 'active') result = result.filter(a => a.is_active);
    else if (filter === 'inactive') result = result.filter(a => !a.is_active);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.full_name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query)
      );
    }

    return result;
  }, [admins, filter, searchQuery]);

  const activeCount = admins.filter(a => a.is_active).length;
  const inactiveCount = admins.filter(a => !a.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Admin Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage admin users who can access this dashboard
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Admin
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'all'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-xl font-bold text-gray-900 dark:text-white">{admins.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'active'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{activeCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
          </button>

          <button
            onClick={() => setFilter('inactive')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'inactive'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{inactiveCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Inactive</div>
          </button>
        </div>

        {filteredAdmins.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{searchQuery ? 'No admins match your search' : 'No admins found'}</p>
            {admins.length === 0 && (
              <p className="text-sm mt-2">Add your first admin to get started</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAdmins.map((admin) => (
              <div
                key={admin.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {admin.full_name}
                      </h4>
                      {admin.user_id === user?.id && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          You
                        </span>
                      )}
                      {admin.is_active ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{admin.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Added {new Date(admin.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewSetupLink(admin)}
                      disabled={deletingAdminId === admin.id}
                      className="px-3 py-1.5 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="View setup link"
                    >
                      <Link2 className="w-4 h-4" />
                      Setup Link
                    </button>
                    {admin.user_id !== user?.id && (
                      <>
                        <button
                          onClick={() => handleToggleActive(admin.id, admin.is_active)}
                          disabled={deletingAdminId === admin.id}
                          className={`px-3 py-1.5 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                            admin.is_active
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {admin.is_active ? (
                            <>
                              <XCircle className="w-4 h-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Reactivate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.user_id, admin.full_name)}
                          disabled={deletingAdminId === admin.id}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete admin"
                        >
                          {deletingAdminId === admin.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddAdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadAdmins}
      />

      <ViewSetupLinkModal
        isOpen={showSetupLinkModal}
        onClose={() => {
          setShowSetupLinkModal(false);
          setSelectedAdmin(null);
        }}
        admin={selectedAdmin}
      />
    </div>
  );
}
