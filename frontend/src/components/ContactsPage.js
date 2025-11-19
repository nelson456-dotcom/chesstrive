import React, { useState } from 'react';

const ContactsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto">
            Have questions, feedback, or need help? We're here to assist you on your chess journey.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl">
                    📧
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Email Support</h3>
                    <p className="text-gray-300 mb-2">Get help via email</p>
                    <a href="mailto:support@chessstrive.com" className="text-blue-400 hover:text-blue-300">
                      support@chessstrive.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-2xl">
                    💬
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Live Chat</h3>
                    <p className="text-gray-300 mb-2">Chat with our support team</p>
                    <p className="text-gray-400">Available 24/7 for Pro and Master users</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                    📞
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Phone Support</h3>
                    <p className="text-gray-300 mb-2">Call us directly</p>
                    <p className="text-gray-400">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-500">Mon-Fri, 9AM-6PM EST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-6">Follow Us</h2>
              <div className="grid grid-cols-2 gap-4">
                <a href="#" className="flex items-center space-x-3 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
                  <div className="text-2xl">📘</div>
                  <span>Facebook</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
                  <div className="text-2xl">🐦</div>
                  <span>Twitter</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
                  <div className="text-2xl">📷</div>
                  <span>Instagram</span>
                </a>
                <a href="#" className="flex items-center space-x-3 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
                  <div className="text-2xl">💼</div>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Need Quick Answers?</h2>
              <p className="text-blue-100 mb-6">
                Check out our FAQ section for instant answers to common questions.
              </p>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                View FAQ
              </button>
            </div>
          </div>
        </div>

        {/* Response Time Info */}
        <div className="mt-16 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Response Times</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">&lt; 1 hour</div>
              <p className="text-gray-300">Live Chat (Pro/Master)</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">&lt; 24 hours</div>
              <p className="text-gray-300">Email Support</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">&lt; 2 hours</div>
              <p className="text-gray-300">Phone Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;
