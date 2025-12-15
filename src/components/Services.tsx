import React from 'react';
import { ShoppingBag, Headphones, BarChart3, Shield, Lightbulb, Zap } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: ShoppingBag,
      title: 'Curated Product Selection',
      description: 'Premium dental equipment, materials, and technology solutions hand-picked for quality and performance.',
      features: ['Latest Technology', 'Quality Assurance', 'Competitive Pricing']
    },
    {
      icon: Headphones,
      title: 'Expert Consultation',
      description: 'Personalized guidance from industry professionals to help you make informed decisions for your practice.',
      features: ['1-on-1 Sessions', 'Custom Solutions', 'Ongoing Support']
    },
    {
      icon: BarChart3,
      title: 'Practice Growth Analytics',
      description: 'Data-driven insights and strategies to optimize your practice operations and maximize revenue.',
      features: ['Performance Metrics', 'Growth Strategies', 'ROI Analysis']
    },
    {
      icon: Shield,
      title: 'Compliance & Safety',
      description: 'Ensure your practice meets all regulatory requirements with our compliance management solutions.',
      features: ['Regulatory Updates', 'Safety Protocols', 'Documentation']
    },
    {
      icon: Lightbulb,
      title: 'Innovation Partnerships',
      description: 'Connect with cutting-edge dental technology companies and emerging industry innovations.',
      features: ['Early Access', 'Beta Testing', 'Innovation Updates']
    },
    {
      icon: Zap,
      title: 'Efficiency Solutions',
      description: 'Streamline your practice operations with workflow optimization and automation tools.',
      features: ['Process Automation', 'Time Management', 'Cost Reduction']
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block bg-secondary-100 text-secondary-800 px-4 py-2 rounded-full text-sm font-medium mb-6 font-inter">
            Our Services
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-inter">
            Comprehensive Solutions for
            <span className="text-secondary-600 block">Modern Dental Practices</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter font-light">
            From select products to expert consultation, we provide everything you need to elevate your practice and exceed patient expectations.
          </p>
        </div>
        
        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={service.title}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-3 rounded-2xl w-fit mb-6">
                <service.icon className="text-white" size={24} />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">{service.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed font-inter">{service.description}</p>
              
              <div className="space-y-2">
                {service.features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                    <span className="text-gray-700 text-sm font-inter">{feature}</span>
                  </div>
                ))}
              </div>
              
            </div>
          ))}
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-12 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 font-inter">Ready to Transform Your Practice?</h3>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto font-inter font-light">
              Explore dental supplies from our trusted partners below for your unique needs and goals.
            </p>
           
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;