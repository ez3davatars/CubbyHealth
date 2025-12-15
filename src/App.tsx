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
import { useAuth } from './contexts/AuthContext';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  if (showAdmin) {
    if (!user) {
      return <Auth />;
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