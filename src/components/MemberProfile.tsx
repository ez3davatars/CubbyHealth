import { useState, useEffect } from 'react';
import { Edit2, Save, X, User, Building2, Phone, Mail, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMemberProfile, type MemberUser } from '../lib/memberAuth';

interface MemberProfileProps {
  userId: string;
  onBack: () => void;
}

export default function MemberProfile({ userId, onBack }: MemberProfileProps) {
  const [profile, setProfile] = useState<MemberUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    full_name: '',
    company_name: '',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getMemberProfile(userId);
      if (data) {
        setProfile(data);
        setEditForm({
          full_name: data.full_name || '',
          company_name: data.company_name || '',
          phone: data.phone || '',
        });
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
      });
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    if (!editForm.full_name.trim()) {
      setError('Full name is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('member_users')
        .update({
          full_name: editForm.full_name.trim(),
          company_name: editForm.company_name.trim() || null,
          phone: editForm.phone.trim() || null,
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await loadProfile();
      setIsEditing(false);
      setSuccess('Profile updated successfully!');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getEmail = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.email || 'N/A';
  };

  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    getEmail().then(setEmail);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Profile not found</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">My Profile</h2>
            <button
              onClick={onBack}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-start justify-between pb-6 border-b">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                    <p className="text-sm text-gray-500">Manage your personal details</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  {profile.is_approved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Pending Approval
                    </span>
                  )}

                  {profile.is_active ? (
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.full_name}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{email}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4" />
                  Company Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.company_name}
                    onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name (optional)"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">
                    {profile.company_name || 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number (optional)"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">
                    {profile.phone || 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Account Details</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Member Since:</span>
                  <p className="text-gray-900 font-medium">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {profile.approved_at && (
                  <div>
                    <span className="text-gray-500">Approved On:</span>
                    <p className="text-gray-900 font-medium">
                      {new Date(profile.approved_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
