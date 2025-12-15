import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, MousePointerClick, Target, Calendar, Filter } from 'lucide-react';
import {
  getAnalyticsOverview,
  getPartnerStats,
  getTimeSeriesData,
  getRecentConversions,
  getDetailedClicks,
  AnalyticsOverview,
  PartnerStats,
  TimeSeriesData,
  ConversionRecord,
  ClickRecord
} from '../lib/analytics';
import { supabase } from '../lib/supabase';

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [partnerStats, setPartnerStats] = useState<PartnerStats[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [recentConversions, setRecentConversions] = useState<ConversionRecord[]>([]);
  const [detailedClicks, setDetailedClicks] = useState<ClickRecord[]>([]);
  const [partners, setPartners] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [activeView, setActiveView] = useState<'overview' | 'clicks'>('overview');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    loadAnalytics();
    loadPartners();
  }, [dateRange, selectedPartner]);

  async function loadPartners() {
    const { data } = await supabase
      .from('partner_companies')
      .select('id, name')
      .order('name');
    if (data) setPartners(data);
  }

  async function loadAnalytics() {
    setLoading(true);
    try {
      const startDate = dateRange === 'all' ? undefined : getStartDate(dateRange);
      const endDate = new Date().toISOString();

      const [overviewData, statsData, timeData, conversionsData, clicksData] = await Promise.all([
        getAnalyticsOverview(startDate, endDate),
        getPartnerStats(startDate, endDate),
        getTimeSeriesData(parseInt(dateRange === 'all' ? '90' : dateRange)),
        getRecentConversions(10),
        getDetailedClicks(startDate, endDate, selectedPartner === 'all' ? undefined : selectedPartner)
      ]);

      setOverview(overviewData);
      setPartnerStats(statsData);
      setTimeSeriesData(timeData);
      setRecentConversions(conversionsData);
      setDetailedClicks(clicksData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStartDate(days: string): string {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(days));
    return date.toISOString();
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function getBrowserFromUserAgent(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clicks"
          value={overview?.totalClicks.toLocaleString() || '0'}
          icon={MousePointerClick}
          color="blue"
        />
        <StatCard
          title="Conversions"
          value={overview?.totalConversions.toLocaleString() || '0'}
          icon={Target}
          color="green"
          subtitle={`${overview?.conversionRate.toFixed(2)}% rate`}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(overview?.totalRevenue || 0)}
          icon={DollarSign}
          color="purple"
          subtitle={`${formatCurrency(overview?.averageOrderValue || 0)} avg`}
        />
        <StatCard
          title="Commission Earned"
          value={formatCurrency(overview?.totalCommission || 0)}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Clicks & Conversions Over Time</h3>
          <div className="space-y-3">
            {timeSeriesData.slice(-14).reverse().map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-20">{formatDate(data.date)}</span>
                <div className="flex-1 flex gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Clicks</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{data.clicks}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((data.clicks / Math.max(...timeSeriesData.map(d => d.clicks))) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Conv</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{data.conversions}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((data.conversions / Math.max(...timeSeriesData.map(d => d.conversions), 1)) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Click Details</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Partners</option>
                {partners.map(partner => (
                  <option key={partner.id} value={partner.id}>{partner.name}</option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Partner</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date & Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Browser</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[...detailedClicks]
                  .sort((a, b) => {
                    const dateA = new Date(a.clicked_at).getTime();
                    const dateB = new Date(b.clicked_at).getTime();
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                  })
                  .slice(0, 10)
                  .map((click) => (
                  <tr key={click.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {click.partner_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(click.clicked_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {getBrowserFromUserAgent(click.user_agent)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {click.ip_address || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {detailedClicks.length === 0 && (
              <div className="text-center py-8">
                <MousePointerClick className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No clicks recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Conversions</h3>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentConversions.map((conversion) => (
                <tr key={conversion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {conversion.partner_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {conversion.conversion_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(conversion.conversion_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(conversion.commission_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        conversion.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : conversion.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {conversion.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(conversion.converted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentConversions.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No conversions tracked yet</p>
              <p className="text-sm text-gray-400 mt-2">Conversions will appear here once tracked</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
}
