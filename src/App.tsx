import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Partners from './components/Partners';
import WhyChooseUs from './components/WhyChooseUs';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import Auth from './components/Auth';
import MemberRegister from './components/MemberRegister';
import MemberLogin from './components/MemberLogin';
import ResetPassword from './components/ResetPassword';
import VendorPortal from './components/VendorPortal';
import AdminPasswordSetup from './components/AdminPasswordSetup';
import { useAuth } from './contexts/AuthContext';
import { isUserAdmin } from './lib/adminAuth';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    async function checkAdminStatus() {
      if (user && showAdmin) {
        setCheckingAdmin(true);
        const adminStatus = await isUserAdmin();
        setIsAdmin(adminStatus);
        setCheckingAdmin(false);
      } else {
        setIsAdmin(null);
      }
    }

    checkAdminStatus();
  }, [user, showAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (currentPath === '/member-register') {
    return <MemberRegister />;
  }

  if (currentPath === '/member-login') {
    return <MemberLogin />;
  }

  if (currentPath === '/reset-password') {
    return <ResetPassword />;
  }

  if (currentPath === '/vendor-portal') {
    return <VendorPortal />;
  }

  if (currentPath.startsWith('/admin-setup/')) {
    const token = currentPath.split('/admin-setup/')[1];
    return <AdminPasswordSetup token={token} />;
  }

  if (showAdmin) {
    if (!user) {
      return <Auth />;
    }

    if (checkingAdmin) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
          </div>
        </div>
      );
    }

    if (isAdmin === false) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You do not have administrator privileges to access this area.
            </p>
            <button
              onClick={() => setShowAdmin(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Return to Website
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowAdmin(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-colors"
          >
            Back to Website
          </button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Header />
      <Hero />
      <Services />
      <Partners />
      <WhyChooseUs />
      <Contact />
      <Footer onAdminClick={() => setShowAdmin(true)} />
    </div>
  );
}

export default App;