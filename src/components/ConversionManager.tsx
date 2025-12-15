import { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getAllPartners, PartnerCompany } from '../lib/affiliateTracking';
import { createConversion, getRecentConversions, updateConversionStatus, ConversionRecord } from '../lib/analytics';

export default function ConversionManager() {
  const [partners, setPartners] = useState<PartnerCompany[]>([]);
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_id: '',
    conversion_value: '',
    commission_amount: '',
    conversion_type: 'sale',
    status: 'confirmed',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [partnersData, conversionsData] = await Promise.all([
      getAllPartners(),
      getRecentConversions(50)
    ]);
    setPartners(partnersData);
    setConversions(conversionsData);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createConversion({
        company_id: formData.company_id,
        conversion_value: parseFloat(formData.conversion_value),
        commission_amount: parseFloat(formData.commission_amount),
        conversion_type: formData.conversion_type,
        status: formData.status as any,
        notes: formData.notes || undefined
      });

      setFormData({
        company_id: '',
        conversion_value: '',
        commission_amount: '',
        conversion_type: 'sale',
        status: 'confirmed',
        notes: ''
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating conversion:', error);
      alert('Failed to create conversion');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (conversionId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      await updateConversionStatus(conversionId, newStatus);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Conversion Tracking</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Track Conversion
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Record New Conversion</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Partner *
                </label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a partner...</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conversion Type *
                </label>
                <select
                  value={formData.conversion_type}
                  onChange={(e) => setFormData({ ...formData, conversion_type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sale">Sale</option>
                  <option value="signup">Sign Up</option>
                  <option value="lead">Lead</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conversion Value ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.conversion_value}
                  onChange={(e) => setFormData({ ...formData, conversion_value: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commission Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.commission_amount}
                  onChange={(e) => setFormData({ ...formData, commission_amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any additional information..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Saving...' : 'Save Conversion'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Conversions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {conversions.map((conversion) => (
                <tr key={conversion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {conversion.partner_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 rounded text-xs">
                      {conversion.conversion_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${conversion.conversion_value.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ${conversion.commission_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        conversion.status === 'confirmed'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : conversion.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {conversion.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(conversion.converted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {conversion.status !== 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(conversion.id, 'confirmed')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Confirm"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {conversion.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusChange(conversion.id, 'pending')}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="Set Pending"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      {conversion.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusChange(conversion.id, 'cancelled')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {conversions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No conversions tracked yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
