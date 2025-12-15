import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

const Hero = () => {
  const benefits = [
    'Increase Practice Revenue',
    'Improve Patient Satisfaction',
    'Streamline Operations',
    'Expert Guidance & Support'
  ];

  return (
    <section id="home" className="relative pt-24 md:pt-32 pb-12 md:pb-20 overflow-hidden min-h-[100dvh] md:min-h-screen flex items-center">
      {/* Background Elements */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/blue-white-abstract-pattern.webp)',
        }}
      ></div>

      {/* Darker overlay for contrast */}
      <div className="absolute inset-0 bg-white/20 backdrop-brightness-100"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Content */}
          <div className="animate-fade-in-up">
            {/* 🚫 Removed the yellow badge container */}

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 md:mb-6 font-inter">
              Elevate Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 block">
                Dental Practice
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed font-inter font-light">
              Discover select products and services specifically designed for discerning dental professionals.
              Grow your practice, increase your bottom line, and provide exceptional patient care.
            </p>

            {/* Benefits List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mb-6 md:mb-10">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit}
                  className="flex items-center space-x-3 animate-fade-in-delay"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle className="text-accent-500 flex-shrink-0" size={20} />
                  <span className="text-sm md:text-base text-gray-700 font-medium font-inter">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <a
                href="#partners"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 group font-inter text-sm md:text-base"
              >
                <span>Our Vendors</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform duration-200" size={20} />
              </a>

             
            </div>
          </div>

          {/* Choosing Excellence Content */}
          <div className="animate-fade-in relative group">
            {/* Outer gradient glow layers */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary-400 via-accent-400 to-primary-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-700 animate-pulse-slow"></div>
            <div className="absolute -inset-1 bg-gradient-to-br from-accent-300 to-primary-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>

            {/* Floating decorative elements */}
            <div className="absolute -top-3 -right-3 w-20 h-20 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full opacity-20 blur-2xl animate-float"></div>
            <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full opacity-20 blur-2xl animate-float-delayed"></div>

            {/* Card Container with layered border effect */}
            <div className="relative bg-gradient-to-br from-white via-white to-primary-50/30 backdrop-blur-xl rounded-3xl p-[2px] shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
              <div className="relative bg-white/85 backdrop-blur-xl rounded-3xl p-8 md:p-10 overflow-hidden">

                {/* Corner accent decorations */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-accent-400/10 to-transparent rounded-br-full"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary-400/10 to-transparent rounded-tl-full"></div>

                {/* Animated shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                {/* Top accent bar with gradient */}
                <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-accent-400 to-transparent rounded-full"></div>

                {/* Side accent bar */}
                <div className="absolute top-8 left-0 w-1 h-20 bg-gradient-to-b from-accent-400 via-primary-500 to-accent-400 rounded-r-full"></div>

                <div className="relative">
                  {/* Logo */}
                  <div className="inline-flex items-center justify-center mb-4">
                    <img src="/Cubby Health.png" alt="Cubby Health" className="h-16 w-auto object-contain" />
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold mb-6 font-inter leading-tight">
                    <span className="text-gray-700">Choosing Excellence for</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-accent-500 to-primary-500 block animate-gradient">
                      Dental Professionals
                    </span>
                  </h2>

                  <div className="space-y-5">
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed font-inter font-light tracking-wide">
                      At Cubby Health, dental clinicians gain access to premium, handpicked products designed to enhance patient care and practice efficiency. In addition to products, members can connect with trusted service providers offering continuing education, consulting, and other professional resources, some of which provide exclusive savings.
                    </p>

                    <p className="text-base md:text-lg text-gray-600 leading-relaxed font-inter font-light tracking-wide">
                      Our selection focuses on quality and innovation, featuring solutions that go beyond the essentials to help your practice stand out.
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div className="mt-6 h-1 w-24 bg-gradient-to-r from-accent-400 to-primary-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
