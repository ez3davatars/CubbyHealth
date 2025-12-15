import React from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, Settings } from 'lucide-react';

interface FooterProps {
  onAdminClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' }
  ];

  const quickLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Why Choose Us', href: '#why-us' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Company Info */}
          <div>
            <img 
              src="/Cubby Health.png" 
              alt="Cubby Health LLC" 
              className="h-12 w-auto mb-6 filter brightness-0 invert"
            />
            <p className="text-gray-400 mb-6 leading-relaxed font-inter">
              Curated excellence for discerning dental professionals. We help practices grow, 
              increase revenue, and provide exceptional patient care.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="bg-gray-800 p-2 rounded-lg hover:bg-primary-600 transition-colors duration-200"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h3 className="text-lg font-semibold mb-6 font-inter">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 font-inter"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 font-inter">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="text-primary-400 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-white font-medium font-inter">‭914.523.8934‬
</p>
                  <p className="text-gray-400 text-sm font-inter">Mon-Fri: 8AM-6PM EST</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="text-primary-400 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-white font-medium font-inter">care@cubbyhealth.com</p>
                  <p className="text-gray-400 text-sm font-inter">24/7 Email Support</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="text-primary-400 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-white font-medium font-inter">Nationwide Service</p>
                  <p className="text-gray-400 text-sm font-inter">Serving practices across the US</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Newsletter Signup */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 font-inter">Stay Updated</h3>
            <p className="text-lg opacity-90 mb-6 font-inter">
              Get the latest insights and industry trends delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-accent-500 focus:outline-none font-inter"
              />
              <button className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg font-inter">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center gap-4">
              <div className="text-gray-400 text-sm font-inter">
                © 2025 Cubby Health LLC. All rights reserved.
              </div>
              {onAdminClick && (
                <button
                  onClick={onAdminClick}
                  className="text-gray-500 hover:text-gray-300 transition-colors duration-200 p-1.5"
                  aria-label="Admin"
                  title="Admin Access"
                >
                  <Settings size={16} />
                </button>
              )}
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 font-inter">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 font-inter">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 font-inter">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;