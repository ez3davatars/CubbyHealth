import { useState, useEffect, useMemo } from 'react';
import { Users, CheckCircle, XCircle, Clock, Building2, Phone, Mail, Calendar, Trash2, UserPlus, Search, X, Copy, CheckCheck } from 'lucide-react';
import { getAllMembers, approveMember, toggleMemberActive, deleteMember, adminCreateMember, bulkApprovePending, MemberUser } from '../lib/memberAuth';
import { sendApprovalEmailViaSupabase } from '../lib/memberNotifications';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  loading: boolean;
}

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, memberName, loading }: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const isValid = confirmText === 'DELETE';

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Delete Member</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Are you sure you want to permanently delete <strong>{memberName}</strong>'s account?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
              This action cannot be undone.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Type DELETE"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || !isValid}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({ isOpen, onClose, onSuccess }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    company_name: '',
    phone: '',
    auto_approve: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ password?: string; note?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminCreateMember({
        email: formData.email,
        full_name: formData.full_name,
        company_name: formData.company_name || undefined,
        phone: formData.phone || undefined,
        auto_approve: formData.auto_approve,
      });

      setResult({
        password: response.temporary_password,
        note: response.password_note,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (result?.password) {
      await navigator.clipboard.writeText(result.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      full_name: '',
      company_name: '',
      phone: '',
      auto_approve: true,
    });
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Member</h3>
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
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold">Member created successfully!</span>
              </div>

              {result.password && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Temporary Password
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border border-amber-300 dark:border-amber-700 text-sm font-mono text-gray-900 dark:text-gray-100">
                      {result.password}
                    </code>
                    <button
                      onClick={handleCopyPassword}
                      className="p-2 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded transition-colors"
                      title="Copy password"
                    >
                      {copied ? <CheckCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    {result.note}
                  </p>
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
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Company Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_approve"
                  checked={formData.auto_approve}
                  onChange={(e) => setFormData({ ...formData, auto_approve: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="auto_approve" className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-approve this member (skip approval step)
                </label>
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
                      Create Member
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

export default function MemberManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    memberId: string;
    userId: string;
    fullName: string;
  } | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    const data = await getAllMembers();
    setMembers(data);
    setLoading(false);
  }

  const handleApproveMember = async (memberId: string) => {
    if (!user) return;

    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    try {
      await approveMember(memberId, user.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const emailResult = await sendApprovalEmailViaSupabase(memberId, session.access_token);
        if (!emailResult.success) {
          console.error('Failed to send approval email:', emailResult.error);
        }
      }

      await loadMembers();
    } catch (error) {
      console.error('Error approving member:', error);
      alert('Failed to approve member');
    }
  };

  const handleBulkApprove = async () => {
    if (!user) return;

    const pendingMembers = members.filter(m => !m.is_approved);
    if (pendingMembers.length === 0) {
      alert('No pending members to approve');
      return;
    }

    if (!confirm(`Are you sure you want to approve all ${pendingMembers.length} pending member(s)?`)) return;

    setBulkApproving(true);
    try {
      const count = await bulkApprovePending(user.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await Promise.all(
          pendingMembers.map(async (member) => {
            const emailResult = await sendApprovalEmailViaSupabase(member.id, session.access_token);
            if (!emailResult.success) {
              console.error(`Failed to send approval email to ${member.email}:`, emailResult.error);
            }
          })
        );
      }

      await loadMembers();
      alert(`Successfully approved ${count} member(s)`);
    } catch (error) {
      console.error('Error bulk approving:', error);
      alert('Failed to bulk approve members');
    } finally {
      setBulkApproving(false);
    }
  };

  const handleToggleActive = async (memberId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} this member?`)) return;

    try {
      await toggleMemberActive(memberId, !currentStatus);
      await loadMembers();
    } catch (error) {
      console.error('Error toggling member status:', error);
      alert('Failed to update member status');
    }
  };

  const handleDeleteMember = (memberId: string, userId: string, fullName: string) => {
    setDeleteModal({
      isOpen: true,
      memberId,
      userId,
      fullName,
    });
  };

  const confirmDeleteMember = async () => {
    if (!deleteModal) return;

    const { memberId, userId, fullName } = deleteModal;
    setDeletingMemberId(memberId);

    try {
      console.log('MemberManagement: Starting deletion for member:', memberId);
      const result = await deleteMember(memberId, userId);
      console.log('MemberManagement: Deletion result:', result);

      setMembers(prevMembers => prevMembers.filter(m => m.id !== memberId));

      await loadMembers();

      setDeleteModal(null);

      let message = `${fullName}'s account has been deleted successfully.`;
      if (result.warnings && result.warnings.length > 0) {
        message += '\n\nNotes:\n' + result.warnings.map((w: string) => `- ${w}`).join('\n');
      }
      alert(message);
    } catch (error: any) {
      console.error('MemberManagement: Error deleting member:', error);

      const errorMsg = error?.message || 'Failed to delete member';
      alert(`Failed to delete member: ${errorMsg}\n\nPlease check the browser console for more details.`);

      await loadMembers();
      setDeleteModal(null);
    } finally {
      setDeletingMemberId(null);
    }
  };

  const filteredMembers = useMemo(() => {
    let result = members;

    if (filter === 'pending') result = result.filter(m => !m.is_approved);
    else if (filter === 'approved') result = result.filter(m => m.is_approved && m.is_active);
    else if (filter === 'inactive') result = result.filter(m => !m.is_active);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.full_name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        (m.company_name && m.company_name.toLowerCase().includes(query))
      );
    }

    return result;
  }, [members, filter, searchQuery]);

  const pendingCount = members.filter((m) => !m.is_approved).length;
  const approvedCount = members.filter((m) => m.is_approved && m.is_active).length;
  const inactiveCount = members.filter((m) => !m.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading members...</p>
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
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Member Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Approve and manage member access to the vendor portal
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
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
          {pendingCount > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={bulkApproving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {bulkApproving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Approve All ({pendingCount})
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'all'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-xl font-bold text-gray-900 dark:text-white">{members.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'pending'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filter === 'approved'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{approvedCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Approved</div>
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

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{searchQuery ? 'No members match your search' : 'No members found for this filter'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {member.full_name}
                      </h4>
                      {!member.is_approved && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {member.is_approved && member.is_active && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Active
                        </span>
                      )}
                      {!member.is_active && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      {member.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.company_name && (
                        <div className="flex items-center gap-2 truncate">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{member.company_name}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!member.is_approved && (
                      <button
                        onClick={() => handleApproveMember(member.id)}
                        disabled={deletingMemberId === member.id}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    {member.is_approved && (
                      <button
                        onClick={() => handleToggleActive(member.id, member.is_active)}
                        disabled={deletingMemberId === member.id}
                        className={`px-3 py-1.5 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                          member.is_active
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {member.is_active ? (
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
                    )}
                    <button
                      onClick={() => handleDeleteMember(member.id, member.user_id, member.full_name)}
                      disabled={deletingMemberId === member.id}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete member"
                    >
                      {deletingMemberId === member.id ? (
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadMembers}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal?.isOpen || false}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDeleteMember}
        memberName={deleteModal?.fullName || ''}
        loading={deletingMemberId === deleteModal?.memberId}
      />
    </div>
  );
}
