import React, { useState, useRef } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertTriangle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    practice: '',
    visitorType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [spamAnswer, setSpamAnswer] = useState('');
  const spamA = useRef(Math.floor(Math.random() * 4) + 2);
  const spamB = useRef(Math.floor(Math.random() * 4) + 2);
  const formRef = useRef<HTMLFormElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const correctAnswer = spamA.current + spamB.current;
    if (Number(spamAnswer) !== correctAnswer) {
      setErrorMessage('Please solve the anti-spam question correctly.');
      setIsSubmitting(false);
      return;
    }

    try {
      const resp = await fetch('/send-contact_(1).php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _gotcha: '',
          a: spamA.current,
          b: spamB.current,
          answer: Number(spamAnswer || 0),
        }),
      });

      let data: any = {};
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await resp.json();
      } else {
        const txt = await resp.text();
        try { data = JSON.parse(txt); } catch { data = { ok: false, error: txt || 'Unknown error' }; }
      }

      if (!resp.ok || data?.ok !== true) throw new Error(data?.error || `Request failed with status ${resp.status}`);

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', practice: '', visitorType: '', message: '' });
      setSpamAnswer('');
      setTimeout(() => setSubmitStatus('idle'), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Failed to send message. Please try again later.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Phone, title: 'Phone', info: '‭914-523-8934‬', subtitle: 'Call us for immediate assistance' },
    { icon: Mail, title: 'Email', info: 'care@cubbyhealth.com', subtitle: 'Send us your questions anytime' },
    { icon: MapPin, title: 'Location', info: 'Nationwide Service', subtitle: 'Serving dental practices across the US' },
    { icon: Clock, title: 'Hours', info: 'Mon-Fri: 8AM-6PM EST', subtitle: 'Emergency support available 24/7' }
  ];

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block bg-accent-100 text-accent-800 px-4 py-2 rounded-full text-sm font-medium mb-6 font-inter">
            Get in Touch
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-inter">
            Ready to Elevate <span className="text-primary-600 block">Your Practice?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter font-light">
            Let's discuss how our solutions can help you achieve your practice goals. Contact us today for a personalized consultation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          <div className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 font-inter">Let's Connect</h3>
            <div className="space-y-6 mb-10">
              {contactInfo.map((item) => (
                <div key={item.title} className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="bg-primary-100 p-3 rounded-lg flex-shrink-0">
                    <item.icon className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 font-inter">{item.title}</h4>
                    <p className="text-primary-600 font-medium font-inter">{item.info}</p>
                    <p className="text-gray-600 text-sm font-inter">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
              <h4 className="text-xl font-bold mb-4 font-inter"></h4>
              <p className="mb-6 opacity-90 font-inter">
                Discover how we can help transform your practice with our personalized approach and proven solutions.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
            {submitStatus === 'success' ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Message Sent!</h3>
                <p className="text-gray-600">We'll get back to you within 24-48 hours.</p>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', height: 0, width: 0 }} onChange={() => {}} />

                {submitStatus === 'error' && errorMessage && (
                  <div className="flex items-center space-x-2 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 font-inter animate-fade-in">
                    <AlertTriangle size={20} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {errorMessage && submitStatus !== 'error' && (
                  <div className="flex items-center space-x-2 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-700 font-inter animate-fade-in">
                    <AlertTriangle size={20} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">Full Name *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-inter" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">Email Address *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-inter" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">Phone Number</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-inter" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">I am a *</label>
                      <select
                        name="visitorType"
                        value={formData.visitorType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-inter bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="dental-practice">Dental Practice</option>
                        <option value="manufacturer">Manufacturer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">Practice/Company Name *</label>
                    <input type="text" name="practice" value={formData.practice} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-inter" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">Anti-spam: What is {spamA.current} + {spamB.current}?</label>
                    <input type="number" name="spamAnswer" value={spamAnswer} onChange={(e) => setSpamAnswer(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-inter" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">Message *</label>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} rows={5} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none font-inter" placeholder="Tell us about your practice and how we can help..." />
                  </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 font-inter">
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
