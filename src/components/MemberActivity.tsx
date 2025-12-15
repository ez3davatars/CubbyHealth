import { useState, useEffect } from 'react';
import { Activity, TrendingUp, User, Building2, Calendar, Globe, Download, Printer } from 'lucide-react';
import { getAllMemberClickActivity } from '../lib/memberAuth';

interface ClickActivity {
  id: string;
  clicked_at: string;
  ip_address: string;
  session_id: string;
  user_agent: string;
  company_id: string;
  member_user_id: string;
  partner_companies: {
    name: string;
    category: string;
  };
  member_users: {
    full_name: string;
    company_name: string;
  };
}

export default function MemberActivity() {
  const [activities, setActivities] = useState<ClickActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    setLoading(true);
    const data = await getAllMemberClickActivity();
    setActivities(data);
    setLoading(false);
  }

  const filterActivitiesByDate = (activities: ClickActivity[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return activities.filter((activity) => {
      const clickDate = new Date(activity.clicked_at);
      if (dateFilter === 'today') return clickDate >= today;
      if (dateFilter === 'week') return clickDate >= weekAgo;
      if (dateFilter === 'month') return clickDate >= monthAgo;
      return true;
    });
  };

  const exportToCSV = () => {
    const headers = ['Member', 'Company', 'Vendor', 'Category', 'IP Address', 'Date & Time'];
    const csvData = filteredActivities.map((activity) => [
      activity.member_users?.full_name || 'Unknown',
      activity.member_users?.company_name || '',
      activity.partner_companies?.name || 'Unknown',
      activity.partner_companies?.category || 'N/A',
      activity.ip_address || 'N/A',
      new Date(activity.clicked_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `member-activity-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Member Activity Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #000;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .stats {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-box {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
              flex: 1;
            }
            .stat-value {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f5f5f5;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #ddd;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #eee;
            }
            .category-badge {
              background-color: #e0f2fe;
              color: #0369a1;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>Member Activity Report</h1>
          <div class="subtitle">Filter: ${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)} | Generated: ${new Date().toLocaleString()}</div>

          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${totalClicks}</div>
              <div class="stat-label">Total Clicks</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${uniqueMembers}</div>
              <div class="stat-label">Active Members</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${uniquePartners}</div>
              <div class="stat-label">Vendors Clicked</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>IP Address</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              ${filteredActivities
                .map(
                  (activity) => `
                <tr>
                  <td>
                    <div><strong>${activity.member_users?.full_name || 'Unknown'}</strong></div>
                    ${activity.member_users?.company_name ? `<div style="font-size: 12px; color: #666;">${activity.member_users.company_name}</div>` : ''}
                  </td>
                  <td>${activity.partner_companies?.name || 'Unknown'}</td>
                  <td><span class="category-badge">${activity.partner_companies?.category || 'N/A'}</span></td>
                  <td>${activity.ip_address || 'N/A'}</td>
                  <td>${new Date(activity.clicked_at).toLocaleString()}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 100);
        }, 100);
      };
    }
  };

  const filteredActivities = filterActivitiesByDate(activities);

  const uniqueMembers = new Set(filteredActivities.map((a) => a.member_user_id)).size;
  const uniquePartners = new Set(filteredActivities.map((a) => a.company_id)).size;
  const totalClicks = filteredActivities.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Member Activity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track member clicks and vendor engagement
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>

            <div className="ml-2 pl-2 border-l border-gray-300 dark:border-gray-600 flex gap-2">
              <button
                onClick={exportToCSV}
                disabled={filteredActivities.length === 0}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Export to CSV"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={handlePrint}
                disabled={filteredActivities.length === 0}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalClicks}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueMembers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Members</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{uniquePartners}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Vendors Clicked</div>
              </div>
            </div>
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No activity found for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Member
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Vendor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    IP Address
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {activity.member_users?.full_name || 'Unknown'}
                        </div>
                        {activity.member_users?.company_name && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.member_users.company_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {activity.partner_companies?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 text-xs font-semibold rounded-full">
                        {activity.partner_companies?.category || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Globe className="w-4 h-4" />
                        {activity.ip_address || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(activity.clicked_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
