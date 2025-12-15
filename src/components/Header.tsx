import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Mail } from 'lucide-react';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isMobile = window.innerWidth < 768;

      setIsScrolled(currentScrollY > 20);

      if (isMobile) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'Partners', href: '#partners' },
    { name: 'Why Us', href: '#why-us' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className={`bg-primary-700 text-white py-2 px-4 text-sm transition-all duration-300 ${
        isScrolled ? 'hidden' : 'block'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone size={14} />
              <span>914-523-8934‬</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail size={14} />
              <span>info@cubbyhealth.com</span>
            </div>
          </div>
          <div className="hidden md:block text-xs">
            Elevating Dental Practices Nationwide
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-white/90 backdrop-blur-sm'
      } ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/cubby-health-copy.png" 
                alt="Cubby Health LLC" 
                className="h-12 w-auto"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium transition-colors duration-200 font-inter"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="#contact"
                className="bg-accent-400 hover:bg-accent-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg font-inter"
              >
                Contact Us
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-700 hover:text-primary-500 p-2"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-gray-700 hover:text-primary-500 block px-3 py-2 text-base font-medium transition-colors duration-200 font-inter"
                >
                  {item.name}
                </a>
              ))}
              <div className="px-3 py-2">
                <a
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-accent-400 hover:bg-accent-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg font-inter block text-center"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;