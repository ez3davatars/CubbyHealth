import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllPartners, createPartner, updatePartner, deletePartner, PartnerCompany } from '../lib/affiliateTracking';

export default function PartnerManagement() {
  const [partners, setPartners] = useState<PartnerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    affiliate_url: '',
    logo_url: '',
    is_active: true,
  });

  useEffect(() => {
    loadPartners();
  }, []);

  async function loadPartners() {
    const data = await getAllPartners();
    setPartners(data);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePartner(editingId, formData);
      } else {
        await createPartner(formData);
      }
      resetForm();
      loadPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      alert('Failed to save partner');
    }
  };

  const handleEdit = (partner: PartnerCompany) => {
    setEditingId(partner.id);
    setFormData({
      name: partner.name,
      description: partner.description,
      category: partner.category,
      affiliate_url: partner.affiliate_url,
      logo_url: partner.logo_url || '',
      is_active: partner.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    try {
      await deletePartner(id);
      loadPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('Failed to delete partner');
    }
  };

  const toggleActive = async (partner: PartnerCompany) => {
    try {
      await updatePartner(partner.id, { is_active: !partner.is_active });
      loadPartners();
    } catch (error) {
      console.error('Error toggling partner status:', error);
    }
  };

  const addCubbyHealthAffiliateId = (url: string): string => {
    if (!url) return url;

    try {
      const urlObj = new URL(url);
      const affiliateId = 'cubbyhealth';

      if (urlObj.searchParams.has('ref') ||
          urlObj.searchParams.has('affiliate') ||
          urlObj.searchParams.has('aff') ||
          urlObj.searchParams.has('partner')) {
        return url;
      }

      urlObj.searchParams.set('ref', affiliateId);
      return urlObj.toString();
    } catch {
      return url;
    }
  };

  const handleAffiliateUrlChange = (url: string) => {
    const urlWithAffiliateId = addCubbyHealthAffiliateId(url);
    setFormData({ ...formData, affiliate_url: urlWithAffiliateId });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      affiliate_url: '',
      logo_url: '',
      is_active: true,
    });
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading partners...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingId ? 'Edit Partner' : 'Add New Partner'}
            </h3>
          </div>
          {showForm ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </button>

        {showForm && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Affiliate URL *
            </label>
            <input
              type="url"
              value={formData.affiliate_url}
              onChange={(e) => handleAffiliateUrlChange(e.target.value)}
              onBlur={(e) => handleAffiliateUrlChange(e.target.value)}
              required
              placeholder="Enter partner URL (Cubby Health ID will be added automatically)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The Cubby Health affiliate ID (?ref=cubbyhealth) will be automatically added to track referrals
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active (visible on website)
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {editingId ? 'Update Partner' : 'Add Partner'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Partners</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {partners.map((partner) => (
            <div key={partner.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="w-16 h-16 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{partner.name}</h4>
                      <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        {partner.category}
                      </span>
                      {partner.is_active ? (
                        <span className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{partner.description}</p>
                    <a
                      href={partner.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {partner.affiliate_url}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleActive(partner)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title={partner.is_active ? 'Hide from website' : 'Show on website'}
                  >
                    {partner.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleEdit(partner)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(partner.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {partners.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No partners yet. Add your first partner above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
