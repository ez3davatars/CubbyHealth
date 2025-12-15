import React from 'react';
import { CheckCircle2, Star, Clock, ThumbsUp } from 'lucide-react';

const WhyChooseUs = () => {
  const reasons = [
    {
      icon: Star,
      title: 'Curated Excellence',
      description: 'Every product and service is carefully vetted by industry experts for quality and effectiveness.'
    },
    {
      icon: ThumbsUp,
      title: 'Proven Results',
      description: 'Our clients see an average 25% increase in revenue within the first year of partnership.'
    },
    {
      icon: Clock,
      title: 'Time-Saving Solutions',
      description: 'We do the research so you can focus on what matters most - providing excellent patient care.'
    },
    {
      icon: CheckCircle2,
      title: 'Ongoing Support',
      description: 'Dedicated support team available to help you maximize your investment and achieve your goals.'
    }
  ];

  const testimonialHighlights = [
    '"Cubby Health transformed our practice operations"',
    '"Revenue increased by 30% in just 8 months"',
    '"The best investment we\'ve made for our practice"',
    '"Exceptional service and results"'
  ];

  return (
    <section id="why-us" className="relative py-24 overflow-hidden">
      {/* Background with horizontal flip */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/blue-white-abstract-pattern.webp)',
          transform: 'scaleX(-1)',
        }}
      ></div>

      {/* Light overlay for contrast */}
      <div className="absolute inset-0 bg-white/20 backdrop-brightness-100"></div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block bg-accent-100 text-accent-800 px-5 py-2 rounded-full text-sm font-medium mb-6 font-inter">
            Why Choose Cubby Health
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-inter">
            Partner with the
            <span className="text-primary-600 block mt-2">Industry Leaders</span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-inter font-light">
            When you choose Cubby Health LLC, you're partnering with a team that understands the unique challenges
            and opportunities in the dental industry. We're committed to your success.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={reason.title}
              className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-fade-in-delay"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 p-3 rounded-xl flex-shrink-0">
                  <reason.icon className="text-primary-600" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3 font-inter">{reason.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-inter text-lg">{reason.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;