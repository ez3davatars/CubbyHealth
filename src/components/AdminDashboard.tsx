import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Building2, Image, BarChart3, Target, Moon, Sun, Users, Activity, Settings, Shield } from 'lucide-react';
import PartnerManagement from './PartnerManagement';
import PartnerImageManager from './PartnerImageManager';
import Analytics from './Analytics';
import ConversionManager from './ConversionManager';
import MemberManagement from './MemberManagement';
import MemberActivity from './MemberActivity';
import AdminUserManagement from './AdminUserManagement';
import AdminSettings from './AdminSettings';

type Tab = 'partners' | 'images' | 'analytics' | 'conversions' | 'members' | 'member-activity' | 'admins' | 'settings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('member-activity');
  const { signOut, user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const tabs = [
    { id: 'partners' as Tab, label: 'Partner Management', icon: Building2 },
    { id: 'images' as Tab, label: 'Image Management', icon: Image },
    { id: 'members' as Tab, label: 'Member Management', icon: Users },
    { id: 'member-activity' as Tab, label: 'Member Activity', icon: Activity },
    { id: 'admins' as Tab, label: 'Admin Management', icon: Shield },
    { id: 'conversions' as Tab, label: 'Conversions', icon: Target },
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-4 sm:mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto -mb-px scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div>
          {activeTab === 'partners' && <PartnerManagement />}
          {activeTab === 'images' && <PartnerImageManager />}
          {activeTab === 'members' && <MemberManagement />}
          {activeTab === 'member-activity' && <MemberActivity />}
          {activeTab === 'admins' && <AdminUserManagement />}
          {activeTab === 'conversions' && <ConversionManager />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>
      </div>
    </div>
  );
}
