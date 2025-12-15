import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Trash2, Mail, Calendar, X } from 'lucide-react';

export default function AdminSettings() {
  const { user, deleteAccount } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    if (confirmEmail !== user?.email) {
      setError('Email does not match. Please type your email correctly.');
      return;
    }

    setError('');
    setIsDeleting(true);

    try {
      const { error: deleteError } = await deleteAccount();

      if (deleteError) {
        setError(deleteError.message || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
        return;
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email Address</p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Created</p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{formatDate(user?.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-red-200 dark:border-red-900">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200">Danger Zone</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Irreversible actions that will permanently affect your account
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Delete Admin Account</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Once you delete your account, there is no going back. This will:
          </p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-4 ml-4 list-disc">
            <li>Permanently delete your admin account</li>
            <li>Free up your email address for reuse</li>
            <li>Log you out immediately</li>
            <li>Remove your authentication credentials</li>
          </ul>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Account?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmEmail('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                To confirm deletion, please type your email address:
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded">
                {user?.email}
              </p>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => {
                  setConfirmEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email address"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                disabled={isDeleting}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmEmail('');
                  setError('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!confirmEmail || isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
