import React from 'react';
import { Target, Award, Users, TrendingUp } from 'lucide-react';

const About = () => {
  const stats = [
    { value: '500+', label: 'Practices Served', icon: Users },
    { value: '98%', label: 'Client Satisfaction', icon: Award },
    { value: '25%', label: 'Average Revenue Increase', icon: TrendingUp },
    { value: '10+', label: 'Years Experience', icon: Target },
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="animate-fade-in-up">
            <div className="inline-block bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-sm font-medium mb-6 font-inter">
              About Cubby Health LLC
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-inter">
              Choosing Excellence for
              <span className="text-primary-600 block">Dental Professionals</span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed font-inter font-light">
              At Cubby Health, dental clinicians gain access to premium, handpicked products designed to enhance patient care and practice efficiency. In addition to products, members can connect with trusted service providers offering continuing education, consulting, and other professional resources, some of which provide exclusive savings. 

            </p>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed font-inter font-light">
              Our curated selection focuses on quality and innovation, featuring solutions that go beyond the essentials to help your practice stand out.
            </p>
            
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-2xl border border-primary-100">
              <div className="flex items-start space-x-4">
                <div className="bg-accent-500 p-2 rounded-lg">
                  <Target className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-inter">Our Commitment</h3>
                  <p className="text-gray-600 font-inter">
                    We partner with only the best vendors and service providers, ensuring every recommendation 
                    meets our rigorous standards for quality, reliability, and results.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6 animate-fade-in">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary-100 p-3 rounded-2xl mb-4">
                    <stat.icon className="text-primary-600" size={24} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2 font-inter">{stat.value}</div>
                  <div className="text-gray-600 font-medium font-inter">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;